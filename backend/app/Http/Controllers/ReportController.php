<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use App\Models\Transfer;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function summary(Request $request)
    {
        $warehouseCount = Warehouse::count();
        $inventoryCount = InventoryItem::count();
        $lowStockCount = InventoryItem::whereColumn('quantity', '<=', 'reorderPoint')->count();
        $transferCount = Transfer::count();
        $totalValue = InventoryItem::sum(DB::raw('quantity * unitPrice'));
        $unassignedCount = InventoryItem::whereNull('warehouseId')->count();

        return response()->json([
            'warehouseCount' => $warehouseCount,
            'inventoryCount' => $inventoryCount,
            'lowStockCount' => $lowStockCount,
            'transferCount' => $transferCount,
            'unassignedCount' => $unassignedCount,
            'totalValue' => round((float) $totalValue, 2),
            'generatedAt' => now()->toISOString(),
        ]);
    }

    public function lowStock()
    {
        $items = InventoryItem::with('warehouse')
            ->whereColumn('quantity', '<=', 'reorderPoint')
            ->orderBy('quantity', 'asc')
            ->get();

        return response()->json($items->map(function ($item) {
            return [
                'id' => $item->id,
                'sku' => $item->sku,
                'name' => $item->name,
                'quantity' => $item->quantity,
                'reorderPoint' => $item->reorderPoint,
                'warehouseName' => $item->warehouse?->name ?? 'Unassigned',
            ];
        }));
    }
}
