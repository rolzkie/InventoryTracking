<?php

namespace Tests\Feature;

use App\Models\InventoryItem;
use App\Models\Warehouse;
use Tests\TestCase;

class StockAndWarehouseIntegrityTest extends TestCase
{
    public function test_stock_out_updates_quantity_and_prevents_negative_stock(): void
    {
        [$warehouse, $item] = $this->inventoryFixture(5);

        $this->postJson('/api/transactions', [
            'itemId' => $item->id,
            'warehouseId' => $warehouse->id,
            'transactionType' => 'stock_out',
            'quantity' => 3,
            'referenceNumber' => 'SO-TEST',
        ])->assertCreated();

        $this->assertDatabaseHas('inventory_items', ['id' => $item->id, 'quantity' => 2]);

        $this->postJson('/api/transactions', [
            'itemId' => $item->id,
            'warehouseId' => $warehouse->id,
            'transactionType' => 'stock_out',
            'quantity' => 3,
        ])->assertUnprocessable();

        $this->assertDatabaseHas('inventory_items', ['id' => $item->id, 'quantity' => 2]);
    }

    public function test_deleting_unused_warehouse_unassigns_its_items(): void
    {
        [$warehouse, $item] = $this->inventoryFixture(5);

        $this->deleteJson("/api/warehouses/{$warehouse->id}")->assertOk();

        $this->assertDatabaseMissing('warehouses', ['id' => $warehouse->id]);
        $this->assertDatabaseHas('inventory_items', [
            'id' => $item->id,
            'warehouseId' => null,
        ]);
    }

    public function test_receiving_reorder_increments_inventory_and_clears_out_of_stock_state_once(): void
    {
        [$warehouse, $item] = $this->inventoryFixture(0);

        $reorderId = $this->postJson('/api/reorders', [
            'itemId' => $item->id,
            'quantity' => 10,
        ])->assertCreated()->json('id');

        $this->assertDatabaseHas('app_notifications', [
            'title' => 'Out of Stock',
            'read' => false,
        ]);

        $this->putJson("/api/reorders/{$reorderId}", [
            'status' => 'received',
        ])->assertOk()->assertJsonPath('status', 'received');

        $this->assertDatabaseHas('inventory_items', [
            'id' => $item->id,
            'quantity' => 10,
            'status' => 'in_stock',
        ]);
        $this->assertDatabaseHas('stock_transactions', [
            'itemId' => $item->id,
            'warehouseId' => $warehouse->id,
            'transactionType' => 'stock_in',
            'quantity' => 10,
            'referenceNumber' => "RO-{$reorderId}",
        ]);
        $this->assertDatabaseHas('app_notifications', [
            'title' => 'Out of Stock',
            'read' => true,
        ]);

        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('outOfStock', 0)
            ->assertJsonPath('lowStock', 0);

        $this->getJson('/api/reports/low-stock')
            ->assertOk()
            ->assertJsonMissing(['id' => $item->id]);

        $this->putJson("/api/reorders/{$reorderId}", [
            'status' => 'received',
        ])->assertUnprocessable();

        $this->assertDatabaseHas('inventory_items', [
            'id' => $item->id,
            'quantity' => 10,
        ]);
    }

    private function inventoryFixture(int $quantity): array
    {
        $warehouse = Warehouse::create([
            'name' => 'Integrity Hub',
            'location' => 'Manila',
            'capacity' => 100,
            'manager' => null,
        ]);
        $item = InventoryItem::create([
            'sku' => 'INTEGRITY-'.$quantity,
            'name' => 'Integrity Item',
            'category' => 'Hardware',
            'unit' => 'pcs',
            'quantity' => $quantity,
            'reorderPoint' => 1,
            'maxStock' => 20,
            'warehouseId' => $warehouse->id,
            'unitPrice' => 10,
        ]);

        return [$warehouse, $item];
    }
}
