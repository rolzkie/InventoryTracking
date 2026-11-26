<?php

namespace Tests\Feature;

use App\Models\InventoryItem;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class BorrowAndSecurityTest extends TestCase
{
    private function itemWithStock(int $quantity = 5): InventoryItem
    {
        $warehouse = Warehouse::create(['name' => 'School Store', 'location' => 'Main building', 'capacity' => 100]);
        return InventoryItem::create([
            'sku' => 'BORROW-TEST', 'name' => 'Projector', 'category' => 'Computer Equipment',
            'quantity' => $quantity, 'reorderPoint' => 1, 'maxStock' => 20,
            'warehouseId' => $warehouse->id, 'unitPrice' => 100,
        ]);
    }

    public function test_borrow_and_return_update_stock_and_log_actions(): void
    {
        $item = $this->itemWithStock();
        $borrow = $this->postJson('/api/borrow-records', [
            'itemId' => $item->id,
            'borrowerName' => 'Test Student',
            'quantity' => 4,
            'borrowedAt' => now()->toDateString(),
            'expectedReturnAt' => now()->addDay()->toDateString(),
        ])->assertCreated()->json('id');

        $this->assertDatabaseHas('inventory_items', ['id' => $item->id, 'quantity' => 1, 'status' => 'low_stock']);
        $this->assertDatabaseHas('app_notifications', ['title' => 'Low Stock', 'read' => false]);
        $this->assertDatabaseHas('activity_logs', [
            'action' => 'inventory_borrowed',
            'subjectType' => 'inventory_item',
            'subjectId' => (string) $item->id,
        ]);

        $this->postJson("/api/borrow-records/{$borrow}/return", ['quantity' => 3])->assertOk()->assertJsonPath('status', 'borrowed');
        $this->assertDatabaseHas('inventory_items', ['id' => $item->id, 'quantity' => 4, 'status' => 'in_stock']);
        $this->assertDatabaseHas('app_notifications', ['title' => 'Low Stock', 'read' => true]);

        $this->postJson("/api/borrow-records/{$borrow}/return", ['quantity' => 1])->assertOk()->assertJsonPath('status', 'returned');
        $this->assertDatabaseHas('inventory_items', ['id' => $item->id, 'quantity' => 5]);
        $this->assertDatabaseHas('activity_logs', [
            'action' => 'inventory_returned',
            'subjectType' => 'inventory_item',
            'subjectId' => (string) $item->id,
        ]);
    }

    public function test_borrow_cannot_exceed_available_stock(): void
    {
        $item = $this->itemWithStock(1);
        $this->postJson('/api/borrow-records', [
            'itemId' => $item->id, 'borrowerName' => 'Test', 'quantity' => 2,
            'borrowedAt' => now()->toDateString(), 'expectedReturnAt' => now()->addDay()->toDateString(),
        ])->assertUnprocessable();
        $this->assertDatabaseHas('inventory_items', ['id' => $item->id, 'quantity' => 1]);
    }

    public function test_write_request_without_csrf_token_is_rejected(): void
    {
        $token = 'valid-bearer-token';
        $user = User::factory()->create(['role' => 'admin', 'permission' => 'manage', 'active' => true]);
        $user->forceFill(['api_token' => hash('sha256', $token), 'token_expires_at' => now()->addHour()])->save();

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->withHeader('X-CSRF-TOKEN', '')
            ->postJson('/api/borrow-records', [])->assertStatus(419);
    }

    public function test_expired_auth_cookie_token_is_rejected(): void
    {
        $token = 'expired-bearer-token';
        $user = User::factory()->create(['role' => 'staff', 'permission' => 'manage', 'active' => true]);
        $user->forceFill(['api_token' => hash('sha256', $token), 'token_expires_at' => now()->subMinute()])->save();
        $this->withToken($token)->getJson('/api/inventory')->assertUnauthorized();
    }

    public function test_sql_injection_search_input_does_not_expand_transaction_results(): void
    {
        $item = $this->itemWithStock();
        $this->postJson('/api/transactions', [
            'itemId' => $item->id,
            'warehouseId' => $item->warehouseId,
            'transactionType' => 'stock_in',
            'quantity' => 1,
            'notes' => 'ordinary note',
        ])->assertCreated();

        $payload = urlencode("%' OR 1=1 --");
        $this->getJson('/api/transactions?search='.$payload)->assertOk()->assertExactJson([]);
    }

    public function test_deactivated_account_cannot_log_in(): void
    {
        User::factory()->create([
            'email' => 'disabled@example.test', 'password' => Hash::make('secret123'), 'role' => 'staff', 'active' => false,
        ]);
        $this->loginApi('disabled@example.test', 'secret123')->assertForbidden();
    }

    public function test_login_sets_http_only_lax_cookie_with_eight_hour_expiry(): void
    {
        $user = User::factory()->create([
            'email' => 'cookie@example.test', 'password' => Hash::make('secret123'), 'role' => 'staff', 'active' => true,
        ]);
        $response = $this->loginApi('cookie@example.test', 'secret123')->assertOk();
        $cookie = collect($response->headers->getCookies())->first(fn ($cookie) => $cookie->getName() === 'inventory_auth');
        $this->assertNotNull($cookie);
        $this->assertTrue($cookie->isHttpOnly());
        $this->assertSame('lax', strtolower((string) $cookie->getSameSite()));
        $this->assertSame(8 * 60 * 60, $cookie->getMaxAge());
        $this->assertArrayNotHasKey('token', $response->json());
        $this->assertSame(hash('sha256', $cookie->getValue()), $user->fresh()->api_token);
        $this->assertNotSame($cookie->getValue(), $user->fresh()->api_token);
    }

    public function test_logout_revokes_the_active_token(): void
    {
        User::factory()->create([
            'email' => 'logout@example.test', 'password' => Hash::make('secret123'), 'role' => 'staff', 'active' => true,
        ]);
        $response = $this->loginApi('logout@example.test', 'secret123')->assertOk();
        $cookie = collect($response->headers->getCookies())->first(fn ($cookie) => $cookie->getName() === 'inventory_auth');
        $this->assertNotNull($cookie);
        $token = $cookie->getValue();
        $user = User::where('email', 'logout@example.test')->firstOrFail();

        $this->withToken($token)->postJson('/api/auth/logout')->assertOk();

        $this->assertNull($user->fresh()->api_token);
        $this->assertNull($user->fresh()->token_expires_at);
    }

    public function test_production_api_requires_https_and_sets_secure_auth_cookie(): void
    {
        $this->app->detectEnvironment(fn () => 'production');
        $this->getJson('/api/auth/csrf-token')->assertStatus(400);
        $csrfResponse = $this->call('GET', 'https://localhost/api/auth/csrf-token');
        $csrfResponse->assertOk();

        User::factory()->create([
            'email' => 'secure-cookie@example.test', 'password' => Hash::make('secret123'), 'role' => 'staff', 'active' => true,
        ]);
        $csrf = $csrfResponse->json('csrfToken');
        $response = $this->call('POST', 'https://localhost/api/auth/login', [], [], [], [
            'HTTP_ACCEPT' => 'application/json',
            'CONTENT_TYPE' => 'application/json',
            'HTTP_X_CSRF_TOKEN' => $csrf,
        ], json_encode(['email' => 'secure-cookie@example.test', 'password' => 'secret123']))->assertOk();
        $cookie = collect($response->headers->getCookies())->first(fn ($cookie) => $cookie->getName() === 'inventory_auth');
        $this->assertNotNull($cookie);
        $this->assertTrue($cookie->isSecure());
    }
}
