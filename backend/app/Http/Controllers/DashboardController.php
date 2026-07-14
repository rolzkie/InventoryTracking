<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use App\Models\Warehouse;
use App\Models\Transfer;
use App\Models\StockTransaction;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index()
    {
        $inventory = InventoryItem::with('warehouse')->get();
        $warehouses = Warehouse::all();

        $totalSkus = $inventory->count();
        $outOfStock = $inventory->where('status', 'out_of_stock')->count();
        $lowStock = $inventory->where('status', 'low_stock')->count();
        $totalValue = $inventory->sum(function ($item) {
            return $item->quantity * $item->unitPrice;
        });

        $today = now()->toDateString();
        $todayTransfers = Transfer::whereDate('createdAt', $today)->count();
        $recentStockIn = StockTransaction::where('transactionType', 'stock_in')->whereDate('createdAt', $today)->count();
        $recentStockOut = StockTransaction::where('transactionType', 'stock_out')->whereDate('createdAt', $today)->count();

        $unassigned = $inventory->where('status', 'unassigned')->count();

        $alerts = $inventory
            ->filter(function ($i) {
                return in_array($i->status, ['out_of_stock', 'low_stock'], true);
            })
            ->map(function ($i) {
                return [
                    'id' => $i->id,
                    'name' => $i->name,
                    'sku' => $i->sku,
                    'quantity' => $i->quantity,
                    'status' => $i->status,
                    'alertType' => $i->status === 'out_of_stock' ? 'out_of_stock' : 'low_stock',
                    'warehouseName' => $i->warehouse?->name ?? 'Unassigned',
                ];
            })
            ->values();

        return response()->json([
            'totalSkus' => $totalSkus,
            'unassigned' => $unassigned,
            'outOfStock' => $outOfStock,
            'lowStock' => $lowStock,
            'totalValue' => $totalValue,
            'warehouseCount' => $warehouses->count(),
            'todayTransfers' => $todayTransfers,
            'recentStockIn' => $recentStockIn,
            'recentStockOut' => $recentStockOut,
            'alerts' => $alerts,
        ]);
    }
}
