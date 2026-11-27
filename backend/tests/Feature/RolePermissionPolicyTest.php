<?php

namespace Tests\Feature;

use App\Models\InventoryItem;
use App\Models\User;
use App\Models\Warehouse;
use Tests\TestCase;

class RolePermissionPolicyTest extends TestCase
{
    public function test_anonymous_users_cannot_read_api_data(): void
    {
        $this->withoutHeader('Authorization')
            ->getJson('/api/dashboard')
            ->assertUnauthorized();
    }

    public function test_staff_can_add_update_and_archive_inventory_but_cannot_change_quantity(): void
    {
        $staff = User::factory()->create(['role' => 'staff', 'permission' => 'manage', 'active' => true]);
        $token = $this->issueToken($staff);

        $itemId = $this->withToken($token)->postJson('/api/inventory', [
            'sku' => 'STAFF-POLICY-1',
            'name' => 'Projector',
            'category' => 'Computer Equipment',
            'unit' => 'pcs',
            'quantity' => 5,
            'reorderPoint' => 1,
            'maxStock' => 10,
            'unitPrice' => 100,
        ])->assertCreated()->json('id');

        $this->withToken($token)->putJson("/api/inventory/{$itemId}", [
            'name' => 'Classroom Projector',
        ])->assertOk()->assertJsonPath('name', 'Classroom Projector');

        $this->withToken($token)->putJson("/api/inventory/{$itemId}", [
            'quantity' => 2,
        ])->assertForbidden();
        $this->assertDatabaseHas('inventory_items', ['id' => $itemId, 'quantity' => 5]);

        $this->withToken($token)->deleteJson("/api/inventory/{$itemId}")->assertOk();
        $this->assertSoftDeleted('inventory_items', ['id' => $itemId]);
        $this->withToken($token)->postJson("/api/inventory/{$itemId}/adjust", ['delta' => -1])->assertForbidden();
    }

    public function test_staff_can_record_stock_but_cannot_rewrite_or_delete_history(): void
    {
        $staff = User::factory()->create(['role' => 'staff', 'permission' => 'manage', 'active' => true]);
        $token = $this->issueToken($staff);
        $warehouse = Warehouse::create(['name' => 'School Store', 'location' => 'Main building', 'capacity' => 100]);
        $item = InventoryItem::create([
            'sku' => 'STAFF-TXN-1', 'name' => 'Keyboard', 'category' => 'Computer Equipment',
            'quantity' => 5, 'reorderPoint' => 1, 'maxStock' => 20,
            'warehouseId' => $warehouse->id, 'unitPrice' => 25,
        ]);

        $transactionId = $this->withToken($token)->postJson('/api/transactions', [
            'itemId' => $item->id,
            'warehouseId' => $warehouse->id,
            'transactionType' => 'stock_out',
            'quantity' => 1,
        ])->assertCreated()->json('id');

        $this->withToken($token)->putJson("/api/transactions/{$transactionId}", ['notes' => 'Changed'])->assertForbidden();
        $this->withToken($token)->deleteJson("/api/transactions/{$transactionId}")->assertForbidden();
        $this->assertDatabaseHas('inventory_items', ['id' => $item->id, 'quantity' => 4]);
    }

    public function test_administrator_can_change_and_delete_stock_history(): void
    {
        $warehouse = Warehouse::create(['name' => 'Admin Store', 'location' => 'Main building', 'capacity' => 100]);
        $item = InventoryItem::create([
            'sku' => 'ADMIN-TXN-1', 'name' => 'Mouse', 'category' => 'Computer Equipment',
            'quantity' => 5, 'reorderPoint' => 1, 'maxStock' => 20,
            'warehouseId' => $warehouse->id, 'unitPrice' => 10,
        ]);

        $transactionId = $this->postJson('/api/transactions', [
            'itemId' => $item->id,
            'warehouseId' => $warehouse->id,
            'transactionType' => 'stock_out',
            'quantity' => 1,
        ])->assertCreated()->json('id');

        $this->putJson("/api/transactions/{$transactionId}", ['notes' => 'Corrected by admin'])->assertOk();
        $this->deleteJson("/api/transactions/{$transactionId}")->assertOk();
        $this->assertDatabaseHas('inventory_items', ['id' => $item->id, 'quantity' => 5]);
    }

    public function test_stock_in_history_cannot_be_reversed_after_received_units_were_used(): void
    {
        $warehouse = Warehouse::create(['name' => 'Ledger Store', 'location' => 'Main building', 'capacity' => 100]);
        $item = InventoryItem::create([
            'sku' => 'LEDGER-REVERSAL-1', 'name' => 'Printer Paper', 'category' => 'School Supplies',
            'quantity' => 0, 'reorderPoint' => 1, 'maxStock' => 100,
            'warehouseId' => $warehouse->id, 'unitPrice' => 5,
        ]);

        $stockInId = $this->postJson('/api/transactions', [
            'itemId' => $item->id,
            'warehouseId' => $warehouse->id,
            'transactionType' => 'stock_in',
            'quantity' => 5,
        ])->assertCreated()->json('id');

        $this->postJson('/api/transactions', [
            'itemId' => $item->id,
            'warehouseId' => $warehouse->id,
            'transactionType' => 'stock_out',
            'quantity' => 4,
        ])->assertCreated();

        $this->deleteJson("/api/transactions/{$stockInId}")->assertUnprocessable();
        $this->putJson("/api/transactions/{$stockInId}", ['quantity' => 3])->assertUnprocessable();

        $this->assertDatabaseHas('stock_transactions', ['id' => $stockInId, 'quantity' => 5]);
        $this->assertDatabaseHas('inventory_items', ['id' => $item->id, 'quantity' => 1]);
    }
}
