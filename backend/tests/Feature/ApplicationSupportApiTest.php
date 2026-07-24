<?php

namespace Tests\Feature;

use App\Models\AppNotification;
use App\Models\InventoryItem;
use App\Models\Supplier;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ApplicationSupportApiTest extends TestCase
{
    public function test_login_users_notifications_settings_and_reorders_are_database_backed(): void
    {
        $user = User::factory()->create([
            'email' => 'admin@example.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'active' => true,
        ]);
        $notification = AppNotification::create([
            'userId' => $user->id,
            'title' => 'Test',
            'message' => 'Database notification',
            'type' => 'info',
            'read' => false,
        ]);
        $warehouse = Warehouse::create([
            'name' => 'Test Hub',
            'location' => 'Manila',
            'capacity' => 100,
            'manager' => null,
        ]);
        $item = InventoryItem::create([
            'sku' => 'TEST-REORDER',
            'name' => 'Test Item',
            'category' => 'Hardware',
            'unit' => 'pcs',
            'quantity' => 1,
            'reorderPoint' => 5,
            'maxStock' => 20,
            'warehouseId' => $warehouse->id,
            'unitPrice' => 10,
        ]);
        $supplier = Supplier::create(['name' => 'Test Supplier']);

        $login = $this->postJson('/api/auth/login', [
            'email' => 'admin@example.com',
            'password' => 'password123',
        ])->assertOk()->assertJsonPath('user.id', $user->id);

        $token = $login->json('token');
        $this->withToken($token)->getJson('/api/users')
            ->assertOk()
            ->assertJsonFragment(['email' => 'admin@example.com']);

        $this->patchJson("/api/notifications/{$notification->id}/read")
            ->assertOk()
            ->assertJsonPath('read', true);

        $this->putJson('/api/settings/general', [
            'payload' => ['companyName' => 'Test Company'],
        ])->assertOk();
        $this->getJson('/api/settings')
            ->assertOk()
            ->assertJsonPath('general.companyName', 'Test Company');

        $this->postJson('/api/reorders', [
            'itemId' => $item->id,
            'supplierId' => $supplier->id,
            'quantity' => 19,
        ])->assertCreated();

        $this->assertDatabaseHas('reorder_requests', [
            'itemId' => $item->id,
            'quantity' => 19,
            'status' => 'pending',
        ]);
    }

    public function test_invalid_login_is_rejected(): void
    {
        User::factory()->create([
            'email' => 'admin@example.com',
            'password' => Hash::make('correct-password'),
            'role' => 'admin',
            'active' => true,
        ]);

        $this->postJson('/api/auth/login', [
            'email' => 'admin@example.com',
            'password' => 'wrong-password',
        ])->assertUnprocessable();
    }

    public function test_only_admins_and_managers_can_create_accounts(): void
    {
        $manager = User::factory()->create([
            'email' => 'manager@example.com',
            'password' => Hash::make('password123'),
            'role' => 'manager',
            'active' => true,
        ]);
        $staff = User::factory()->create([
            'email' => 'staff@example.com',
            'password' => Hash::make('password123'),
            'role' => 'staff',
            'active' => true,
        ]);

        $managerToken = $this->postJson('/api/auth/login', [
            'email' => $manager->email,
            'password' => 'password123',
        ])->json('token');
        $staffToken = $this->postJson('/api/auth/login', [
            'email' => $staff->email,
            'password' => 'password123',
        ])->json('token');

        $this->withToken($managerToken)->postJson('/api/users', [
            'name' => 'New Staff',
            'email' => 'new.staff@example.com',
            'password' => 'temporary123',
            'role' => 'staff',
            'active' => true,
        ])->assertCreated();

        $this->withToken($managerToken)->postJson('/api/users', [
            'name' => 'New Admin',
            'email' => 'new.admin@example.com',
            'password' => 'temporary123',
            'role' => 'admin',
            'active' => true,
        ])->assertForbidden();

        $this->withToken($staffToken)->postJson('/api/users', [
            'name' => 'Unauthorized User',
            'email' => 'unauthorized@example.com',
            'password' => 'temporary123',
            'role' => 'staff',
            'active' => true,
        ])->assertForbidden();
    }
}
