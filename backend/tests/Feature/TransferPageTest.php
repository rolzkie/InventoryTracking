<?php

namespace Tests\Feature;

use App\Models\InventoryItem;
use App\Models\Transfer;
use App\Models\Warehouse;
use Tests\TestCase;

class TransferPageTest extends TestCase
{
    public function test_transfers_page_renders_in_laravel_blade(): void
    {
        $warehouseA = Warehouse::create([
            'name' => 'New York Distribution Center',
            'location' => 'New York',
            'capacity' => 1000,
            'used' => 0,
            'manager' => 'Sarah Chen',
        ]);

        $warehouseB = Warehouse::create([
            'name' => 'Chicago Regional Hub',
            'location' => 'Chicago',
            'capacity' => 1000,
            'used' => 0,
            'manager' => 'Alex Wong',
        ]);

        $item = InventoryItem::create([
            'sku' => 'RELAY-48V-100A',
            'name' => '48V Heavy Duty Relay',
            'description' => 'Relay component',
            'category' => 'Relays',
            'unit' => 'pcs',
            'quantity' => 12,
            'reorderPoint' => 20,
            'warehouseId' => $warehouseA->id,
            'storageLocation' => 'A1',
            'zone' => 'A',
            'rack' => '1',
            'shelf' => '1',
            'unitPrice' => 120.50,
            'status' => 'low_stock',
        ]);

        Transfer::create([
            'sourceWarehouse' => $warehouseA->id,
            'destinationWarehouse' => $warehouseB->id,
            'itemId' => $item->id,
            'itemName' => $item->name,
            'quantity' => 2,
            'status' => 'pending',
            'notes' => 'Test transfer',
            'createdAt' => now(),
        ]);

        $response = $this->get('/transfers');

        $response->assertOk();
        $response->assertSee('Transfers');
        $response->assertSee('48V Heavy Duty Relay');
    }
}
