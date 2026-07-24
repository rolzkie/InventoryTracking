<?php

namespace Tests\Feature;

use App\Models\InventoryItem;
use App\Models\Warehouse;
use Tests\TestCase;

class WarehousePageTest extends TestCase
{
    public function test_warehouses_page_renders_in_laravel_blade(): void
    {
        Warehouse::create([
            'name' => 'New York Distribution Center',
            'location' => 'New York',
            'capacity' => 1000,
            'used' => 0,
            'manager' => 'Sarah Chen',
        ]);

        InventoryItem::create([
            'sku' => 'RELAY-48V-100A',
            'name' => '48V Heavy Duty Relay',
            'description' => 'Relay component',
            'category' => 'Relays',
            'unit' => 'pcs',
            'quantity' => 12,
            'reorderPoint' => 20,
            'warehouseId' => 1,
            'storageLocation' => 'A1',
            'zone' => 'A',
            'rack' => '1',
            'shelf' => '1',
            'unitPrice' => 120.50,
            'status' => 'low_stock',
        ]);

        $response = $this->get('/warehouses');

        $response->assertOk();
        $response->assertSee('Warehouses');
        $response->assertSee('New York Distribution Center');
    }
}
