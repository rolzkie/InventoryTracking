<?php

namespace Tests\Feature;

use App\Models\InventoryItem;
use App\Models\Supplier;
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

    public function test_inventory_update_allows_the_same_sku_to_be_saved(): void
    {
        $warehouse = Warehouse::create([
            'name' => 'North Hub',
            'location' => 'Seattle',
            'capacity' => 1000,
            'used' => 0,
            'manager' => 'Alicia',
        ]);

        $item = InventoryItem::create([
            'sku' => 'SKU-KEEP-001',
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
            'sku' => 'SKU-KEEP-001',
            'name' => 'Laptop Pro',
        ]);

        $response->assertOk()
            ->assertJsonPath('sku', 'SKU-KEEP-001')
            ->assertJsonPath('name', 'Laptop Pro');
    }

    public function test_inventory_update_allows_a_sku_that_exists_in_another_warehouse(): void
    {
        $firstWarehouse = Warehouse::create([
            'name' => 'North Hub',
            'location' => 'Seattle',
            'capacity' => 1000,
            'used' => 0,
            'manager' => 'Alicia',
        ]);
        $secondWarehouse = Warehouse::create([
            'name' => 'South Hub',
            'location' => 'Austin',
            'capacity' => 1000,
            'used' => 0,
            'manager' => 'Marco',
        ]);

        $firstItem = InventoryItem::create([
            'sku' => 'SKU-SHARED-001',
            'name' => 'Laptop',
            'description' => 'First item',
            'category' => 'Electronics',
            'quantity' => 2,
            'reorderPoint' => 5,
            'warehouseId' => $firstWarehouse->id,
            'unitPrice' => 999.99,
            'lastRestocked' => now()->toDateString(),
        ]);
        InventoryItem::create([
            'sku' => 'SKU-SHARED-001',
            'name' => 'Laptop Backup',
            'description' => 'Second item',
            'category' => 'Electronics',
            'quantity' => 8,
            'reorderPoint' => 5,
            'warehouseId' => $secondWarehouse->id,
            'unitPrice' => 899.99,
            'lastRestocked' => now()->toDateString(),
        ]);

        $response = $this->putJson('/api/inventory/' . $firstItem->id, [
            'sku' => 'SKU-SHARED-001',
            'name' => 'Laptop Updated',
        ]);

        $response->assertOk()
            ->assertJsonPath('sku', 'SKU-SHARED-001')
            ->assertJsonPath('name', 'Laptop Updated');
    }

    public function test_inventory_create_accepts_quantity_and_persists_it(): void
    {
        $response = $this->postJson('/api/inventory', [
            'name' => 'Keyboard',
            'description' => 'Mechanical keyboard',
            'category' => 'Electronics',
            'unit' => 'pcs',
            'quantity' => 12,
            'reorderPoint' => 3,
            'unitPrice' => 79.99,
        ]);

        $response->assertCreated()
            ->assertJsonPath('quantity', 12)
            ->assertJsonPath('name', 'Keyboard');

        $this->assertNotEmpty($response->json('sku'));
        $this->assertStringStartsWith('SKU-', $response->json('sku'));
    }

    public function test_inventory_create_can_auto_create_a_supplier_from_a_typed_name(): void
    {
        $response = $this->postJson('/api/inventory', [
            'sku' => 'SKU-003-SUP',
            'name' => 'Keyboard',
            'description' => 'Mechanical keyboard',
            'category' => 'Electronics',
            'unit' => 'pcs',
            'quantity' => 12,
            'reorderPoint' => 3,
            'unitPrice' => 79.99,
            'supplierName' => '  New Supplier Co.  ',
        ]);

        $response->assertCreated();

        $this->assertDatabaseHas('suppliers', [
            'name' => 'New Supplier Co.',
        ]);

        $supplier = Supplier::where('name', 'New Supplier Co.')->firstOrFail();

        $this->assertDatabaseHas('inventory_items', [
            'sku' => 'SKU-003-SUP',
            'supplierId' => (string) $supplier->id,
        ]);
    }

    public function test_assignable_inventory_endpoint_returns_only_unassigned_valid_items(): void
    {
        $warehouse = Warehouse::create([
            'name' => 'North Hub',
            'location' => 'Seattle',
            'capacity' => 1000,
            'used' => 0,
            'manager' => 'Alicia',
        ]);

        $assignableItem = InventoryItem::create([
            'sku' => 'SKU-004-A',
            'name' => 'Assignable Item',
            'description' => 'Test item',
            'category' => 'Electronics',
            'quantity' => 5,
            'reorderPoint' => 1,
            'unitPrice' => 150,
            'lastRestocked' => now()->toDateString(),
        ]);

        InventoryItem::create([
            'sku' => 'SKU-004-B',
            'name' => 'Assigned Item',
            'description' => 'Test item',
            'category' => 'Electronics',
            'quantity' => 5,
            'reorderPoint' => 1,
            'warehouseId' => $warehouse->id,
            'unitPrice' => 150,
            'lastRestocked' => now()->toDateString(),
        ]);

        $response = $this->getJson('/api/inventory/assignable');

        $response->assertOk()
            ->assertJsonFragment(['id' => $assignableItem->id])
            ->assertJsonMissing(['sku' => 'SKU-004-B']);
    }

    public function test_assigning_inventory_updates_the_warehouse_capacity_used_values(): void
    {
        $warehouse = Warehouse::create([
            'name' => 'North Hub',
            'location' => 'Seattle',
            'capacity' => 1000,
            'used' => 0,
            'manager' => 'Alicia',
        ]);

        $item = InventoryItem::create([
            'sku' => 'SKU-004',
            'name' => 'Monitor',
            'description' => 'Test item',
            'category' => 'Electronics',
            'quantity' => 5,
            'reorderPoint' => 1,
            'unitPrice' => 150,
            'lastRestocked' => now()->toDateString(),
        ]);

        $assignResponse = $this->postJson('/api/inventory/' . $item->id . '/assign', [
            'warehouseId' => $warehouse->id,
            'storageLocation' => 'Aisle 1',
        ]);

        $assignResponse->assertOk();

        $warehousesResponse = $this->getJson('/api/warehouses');

        $warehousesResponse->assertOk()
            ->assertJsonPath('0.capacityUsed', 5)
            ->assertJsonPath('0.used', 5);
    }
}
