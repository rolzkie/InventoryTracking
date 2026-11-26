<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\InventoryItem;
use App\Models\StockTransaction;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SecurityComplianceTest extends TestCase
{
    private function assignedItem(int $quantity = 10): InventoryItem
    {
        $warehouse = Warehouse::create(['name' => 'Security Store', 'location' => 'Main building', 'capacity' => 100]);
        return InventoryItem::create([
            'sku' => 'SECURITY-'.uniqid(),
            'name' => 'Test Item',
            'category' => 'Equipment',
            'quantity' => $quantity,
            'reorderPoint' => 1,
            'maxStock' => 50,
            'warehouseId' => $warehouse->id,
            'unitPrice' => 10,
        ]);
    }

    public function test_passwords_are_hashed_when_users_are_created(): void
    {
        $user = User::create([
            'name' => 'Hash Check',
            'email' => 'hash-check@example.test',
            'password' => 'secret123',
            'role' => 'staff',
            'permission' => 'manage',
            'active' => true,
        ]);

        $this->assertNotSame('secret123', $user->password);
        $this->assertTrue(Hash::check('secret123', $user->password));
    }

    public function test_viewers_can_only_read_inventory_support_data_and_reports(): void
    {
        $viewer = User::factory()->create(['role' => 'viewer', 'permission' => 'view', 'active' => true]);
        $token = $this->issueToken($viewer);

        foreach ([
            '/api/dashboard',
            '/api/inventory',
            '/api/inventory/assignable',
            '/api/warehouses',
            '/api/categories',
            '/api/suppliers',
            '/api/reports/summary',
            '/api/reports/low-stock',
        ] as $path) {
            $this->withToken($token)->getJson($path)->assertOk();
        }

        foreach ([
            '/api/transactions',
            '/api/transfers',
            '/api/borrow-records',
            '/api/reorders',
            '/api/notifications',
            '/api/settings',
            '/api/alert-acknowledgements',
            '/api/activity-logs',
            '/api/users',
        ] as $path) {
            $this->withToken($token)->getJson($path)->assertForbidden();
        }

        $this->withToken($token)->postJson('/api/inventory', [])->assertForbidden();
    }

    public function test_staff_can_do_stock_work_but_cannot_access_administration(): void
    {
        $staff = User::factory()->create(['role' => 'staff', 'permission' => 'manage', 'active' => true]);
        $token = $this->issueToken($staff);

        $this->withToken($token)->getJson('/api/inventory')->assertOk();
        $this->withToken($token)->getJson('/api/reports/summary')->assertForbidden();
        $this->withToken($token)->getJson('/api/transfers')->assertForbidden();
        $this->withToken($token)->getJson('/api/settings')->assertForbidden();
        $this->withToken($token)->postJson('/api/warehouses', [])->assertForbidden();
        $this->withToken($token)->postJson('/api/categories', [])->assertForbidden();
        $this->withToken($token)->postJson('/api/users', [])->assertForbidden();

        $item = $this->assignedItem();
        $this->withToken($token)->postJson('/api/transactions', [
            'itemId' => $item->id,
            'warehouseId' => $item->warehouseId,
            'transactionType' => 'stock_out',
            'quantity' => 1,
        ])->assertCreated();
    }

    public function test_administrators_can_access_admin_endpoints(): void
    {
        $this->getJson('/api/settings')->assertOk();
        $this->getJson('/api/users')->assertOk();
        $this->postJson('/api/warehouses', [
            'name' => 'Admin Warehouse',
            'location' => 'North building',
            'capacity' => 100,
        ])->assertCreated();
    }

    public function test_admin_adjustment_writes_one_transaction_and_a_detailed_activity_record(): void
    {
        $admin = User::factory()->create(['name' => 'Security Admin', 'role' => 'admin', 'permission' => 'manage', 'active' => true]);
        $token = $this->issueToken($admin);
        $item = $this->assignedItem(10);

        $this->withToken($token)->postJson("/api/inventory/{$item->id}/adjust", [
            'delta' => -3,
            'reason' => 'Damaged during inspection',
        ])->assertOk()->assertJsonPath('quantity', 7);

        $this->assertSame(1, StockTransaction::where('itemId', $item->id)->count());
        $transaction = StockTransaction::where('itemId', $item->id)->firstOrFail();
        $this->assertSame('stock_out', $transaction->transactionType);
        $this->assertSame(3, (int) $transaction->quantity);
        $this->assertSame('adjustment', $transaction->purpose);
        $this->assertStringContainsString('Security Admin (#'.$admin->id.')', $transaction->processedBy);
        $this->assertStringContainsString('Damaged during inspection', $transaction->notes);
        $this->assertNotNull($transaction->createdAt);

        $log = ActivityLog::where('action', 'inventory_quantity_adjusted')->latest('id')->firstOrFail();
        $this->assertSame($admin->id, $log->userId);
        $this->assertSame((string) $item->id, $log->subjectId);
        $this->assertSame(10, $log->details['previous']['quantity']);
        $this->assertSame(7, $log->details['updated']['quantity']);
        $this->assertSame(-3, $log->details['quantityChange']['delta']);
        $this->assertSame('Damaged during inspection', $log->details['reason']);
        $this->assertSame($transaction->id, $log->details['stockTransactionId']);
        $this->assertSame($admin->id, $transaction->userId);
        $this->assertArrayNotHasKey('password', $log->details);
        $this->assertArrayNotHasKey('token', $log->details);
    }

    public function test_initial_quantity_is_recorded_once_when_item_is_first_assigned(): void
    {
        $warehouse = Warehouse::create(['name' => 'Opening Store', 'location' => 'Main building', 'capacity' => 100]);
        $item = InventoryItem::create([
            'sku' => 'OPENING-'.uniqid(),
            'name' => 'Unassigned item',
            'category' => 'Equipment',
            'quantity' => 8,
            'reorderPoint' => 1,
            'unitPrice' => 4,
        ]);

        $this->postJson("/api/inventory/{$item->id}/assign", ['warehouseId' => $warehouse->id])->assertOk();
        $this->postJson("/api/inventory/{$item->id}/assign", ['warehouseId' => $warehouse->id])->assertOk();

        $this->assertSame(1, StockTransaction::where('itemId', $item->id)->count());
        $transaction = StockTransaction::where('itemId', $item->id)->firstOrFail();
        $this->assertSame('opening_balance', $transaction->purpose);
        $this->assertSame(8, (int) $transaction->quantity);
        $this->assertNotNull($transaction->userId);
    }

    public function test_transfer_completion_records_both_sides_once_and_logs_quantities(): void
    {
        $source = Warehouse::create(['name' => 'Transfer Source', 'location' => 'North', 'capacity' => 100]);
        $destination = Warehouse::create(['name' => 'Transfer Destination', 'location' => 'South', 'capacity' => 100]);
        $item = InventoryItem::create([
            'sku' => 'TRANSFER-'.uniqid(),
            'name' => 'Transfer item',
            'category' => 'Equipment',
            'quantity' => 9,
            'reorderPoint' => 1,
            'warehouseId' => $source->id,
            'unitPrice' => 4,
        ]);

        $created = $this->postJson('/api/transfers', [
            'sourceWarehouse' => $source->id,
            'destinationWarehouse' => $destination->id,
            'itemId' => $item->id,
            'quantity' => 3,
            'status' => 'pending',
        ])->assertCreated();
        $transferId = $created->json('id');

        $this->putJson('/api/transfers/'.$transferId, ['status' => 'completed'])->assertOk();

        $this->assertSame(6, (int) $item->fresh()->quantity);
        $destinationItem = InventoryItem::where('sku', $item->sku)->where('warehouseId', $destination->id)->firstOrFail();
        $this->assertSame(3, (int) $destinationItem->quantity);
        $transactions = StockTransaction::where('purpose', 'transfer')->orderBy('transactionType')->get();
        $this->assertCount(2, $transactions);
        $this->assertSame(['stock_in', 'stock_out'], $transactions->pluck('transactionType')->all());
        $this->assertTrue($transactions->every(fn (StockTransaction $row) => $row->userId !== null));

        $logs = ActivityLog::where('action', 'inventory_transfer_completed')->get();
        $this->assertCount(2, $logs);
        $sourceLog = $logs->firstWhere('subjectId', (string) $item->id);
        $this->assertSame(9, $sourceLog->details['previous']['quantity']);
        $this->assertSame(6, $sourceLog->details['updated']['quantity']);
    }

    public function test_adjustment_requires_a_reason_and_cannot_make_stock_negative(): void
    {
        $item = $this->assignedItem(2);

        $this->postJson("/api/inventory/{$item->id}/adjust", ['delta' => -3, 'reason' => 'damage'])->assertUnprocessable();
        $this->postJson("/api/inventory/{$item->id}/adjust", ['delta' => 1])->assertUnprocessable();
        $this->postJson("/api/inventory/{$item->id}/adjust", ['delta' => 0, 'reason' => 'no change'])->assertUnprocessable();

        $this->assertSame(2, (int) $item->fresh()->quantity);
        $this->assertSame(0, StockTransaction::where('itemId', $item->id)->count());
    }

    public function test_quantity_edit_requires_reason_and_creates_one_ledger_transaction(): void
    {
        $item = $this->assignedItem(4);

        $this->putJson("/api/inventory/{$item->id}", ['quantity' => 6])->assertUnprocessable();
        $this->assertSame(4, (int) $item->fresh()->quantity);
        $this->assertSame(0, StockTransaction::where('itemId', $item->id)->count());

        $this->putJson("/api/inventory/{$item->id}", ['quantity' => 6, 'adjustmentReason' => 'Count correction'])->assertOk();
        $this->assertSame(6, (int) $item->fresh()->quantity);
        $this->assertSame(1, StockTransaction::where('itemId', $item->id)->count());
    }

    public function test_password_change_and_deactivation_revoke_existing_tokens(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'permission' => 'manage', 'active' => true]);
        $adminToken = $this->issueToken($admin);
        $target = User::factory()->create(['role' => 'staff', 'permission' => 'manage', 'active' => true]);
        $targetToken = $this->issueToken($target);

        $this->withToken($adminToken)->putJson('/api/users/'.$target->id, [
            'password' => 'newPassword123',
            'password_confirmation' => 'newPassword123',
        ])->assertOk();
        $this->withToken($targetToken)->getJson('/api/dashboard')->assertUnauthorized();
        $this->assertTrue(Hash::check('newPassword123', $target->fresh()->password));

        $targetToken = $this->issueToken($target->fresh());
        $this->withToken($adminToken)->putJson('/api/users/'.$target->id, ['active' => false])->assertOk();
        $this->withToken($targetToken)->getJson('/api/dashboard')->assertUnauthorized();
        $this->assertNull($target->fresh()->api_token);
    }

    public function test_inventory_input_validation_rejects_negative_quantity_and_weak_password(): void
    {
        $this->postJson('/api/inventory', [
            'sku' => 'NEGATIVE-1',
            'name' => 'Invalid item',
            'category' => 'Equipment',
            'quantity' => -1,
            'reorderPoint' => 0,
            'unitPrice' => 10,
        ])->assertUnprocessable()->assertJsonValidationErrors(['quantity']);

        $this->postJson('/api/users', [
            'name' => 'Weak Password',
            'email' => 'weak@example.test',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'staff',
        ])->assertUnprocessable()->assertJsonValidationErrors(['password']);
    }
}
