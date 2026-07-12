<?php

namespace Tests\Feature;

use App\Models\InventoryItem;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_reports_summary_and_low_stock_endpoints_work(): void
    {
        $warehouse = Warehouse::create([
            'name' => 'North Hub',
            'location' => 'Seattle',
            'capacity' => 1000,
            'used' => 0,
            'manager' => 'Alicia',
        ]);

        InventoryItem::create([
            'sku' => 'SKU-010',
            'name' => 'Router',
            'description' => 'Test item',
            'category' => 'Electronics',
            'quantity' => 2,
            'reorderPoint' => 5,
            'warehouseId' => $warehouse->id,
            'unitPrice' => 29.99,
            'lastRestocked' => now()->toDateString(),
        ]);

        $summary = $this->getJson('/api/reports/summary');
        $summary->assertOk()
            ->assertJsonStructure(['warehouseCount', 'inventoryCount', 'lowStockCount', 'transferCount', 'totalValue', 'generatedAt']);

        $lowStock = $this->getJson('/api/reports/low-stock');
        $lowStock->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.sku', 'SKU-010');
    }
}
