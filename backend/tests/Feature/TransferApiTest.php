<?php

namespace Tests\Feature;

use App\Models\InventoryItem;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TransferApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_transfer_can_be_created_via_api(): void
    {
        $sourceWarehouse = Warehouse::create([
            'name' => 'Source Warehouse',
            'location' => 'City A',
            'capacity' => 1000,
            'used' => 0,
            'manager' => 'Jane',
        ]);

        $destinationWarehouse = Warehouse::create([
            'name' => 'Destination Warehouse',
            'location' => 'City B',
            'capacity' => 1000,
            'used' => 0,
            'manager' => 'John',
        ]);

        $item = InventoryItem::create([
            'sku' => 'SKU-TEST-001',
            'name' => 'Test Item',
            'description' => 'Sample item',
            'category' => 'Hardware',
            'quantity' => 10,
            'reorderPoint' => 3,
            'warehouseId' => $sourceWarehouse->id,
            'unitPrice' => 10.50,
            'lastRestocked' => now()->toDateString(),
            'status' => 'in_stock',
        ]);

        $response = $this->postJson('/api/transfers', [
            'sourceWarehouse' => $sourceWarehouse->id,
            'destinationWarehouse' => $destinationWarehouse->id,
            'itemId' => $item->id,
            'quantity' => 2,
            'status' => 'pending',
            'notes' => 'Regression test',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('transfers', [
            'itemId' => $item->id,
            'quantity' => 2,
            'status' => 'pending',
        ]);
    }
}
