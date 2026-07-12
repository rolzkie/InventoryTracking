<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use App\Models\Transfer;
use App\Models\Warehouse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function summary(Request $request)
    {
        $warehouseCount = Warehouse::count();
        $inventoryCount = InventoryItem::count();
        $lowStockCount = InventoryItem::whereColumn('quantity', '<=', 'reorder_point')->count();
        $transferCount = Transfer::count();
        $totalValue = InventoryItem::sum('unit_price');

        return response()->json([
            'warehouseCount' => $warehouseCount,
            'inventoryCount' => $inventoryCount,
            'lowStockCount' => $lowStockCount,
            'transferCount' => $transferCount,
            'totalValue' => round((float) $totalValue, 2),
            'generatedAt' => now()->toISOString(),
        ]);
    }

    public function lowStock()
    {
        $items = InventoryItem::with('warehouse')
            ->whereColumn('quantity', '<=', 'reorder_point')
            ->orderBy('quantity', 'asc')
            ->get();

        return response()->json($items->map(function ($item) {
            return [
                'id' => $item->id,
                'sku' => $item->sku,
                'name' => $item->name,
                'quantity' => $item->quantity,
                'reorderPoint' => $item->reorder_point,
                'warehouseName' => $item->warehouse?->name ?? 'Unassigned',
            ];
        }));
    }
}
