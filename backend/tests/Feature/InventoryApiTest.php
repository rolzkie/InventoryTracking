<?php

namespace Tests\Feature;

use App\Models\InventoryItem;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_inventory_list_includes_warehouse_name_and_status(): void
    {
        $warehouse = Warehouse::create([
            'name' => 'North Hub',
            'location' => 'Seattle',
            'capacity' => 1000,
            'used' => 0,
            'manager' => 'Alicia',
        ]);

        InventoryItem::create([
            'sku' => 'SKU-001',
            'name' => 'Laptop',
            'description' => 'Test item',
            'category' => 'Electronics',
            'quantity' => 2,
            'reorderPoint' => 5,
            'warehouseId' => $warehouse->id,
            'unitPrice' => 999.99,
            'lastRestocked' => now()->toDateString(),
        ]);

        $response = $this->getJson('/api/inventory');

        $response->assertOk()
            ->assertJsonStructure([
                '*' => [
                    'id',
                    'sku',
                    'name',
                    'warehouseName',
                    'status',
                ],
            ])
            ->assertJsonPath('0.status', 'low_stock')
            ->assertJsonPath('0.warehouseName', 'North Hub');
    }

    public function test_inventory_update_works_through_the_api(): void
    {
        $warehouse = Warehouse::create([
            'name' => 'North Hub',
            'location' => 'Seattle',
            'capacity' => 1000,
            'used' => 0,
            'manager' => 'Alicia',
        ]);

        $item = InventoryItem::create([
            'sku' => 'SKU-002',
            'name' => 'Laptop',
            'description' => 'Test item',
            'category' => 'Electronics',
            'quantity' => 2,
            'reorderPoint' => 5,
            'warehouseId' => $warehouse->id,
            'unitPrice' => 999.99,
            'lastRestocked' => now()->toDateString(),
        ]);

        $response = $this->putJson('/api/inventory/' . $item->id, [
            'name' => 'Updated Laptop',
            'quantity' => 3,
        ]);

        $response->assertOk()
            ->assertJsonPath('name', 'Updated Laptop')
            ->assertJsonPath('quantity', 3);
    }
}
