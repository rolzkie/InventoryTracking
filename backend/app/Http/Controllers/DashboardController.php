<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use App\Models\Warehouse;
use App\Models\Transfer;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index()
    {
        $inventory = InventoryItem::all();
        $warehouses = Warehouse::all();
        $transfers = Transfer::all();

        $totalSkus = $inventory->count();
        $outOfStock = $inventory->where('status', 'out_of_stock')->count();
        $lowStock = $inventory->where('status', 'low_stock')->count();
        $totalValue = $inventory->sum(function ($item) {
            return $item->quantity * $item->unitPrice;
        });

        $today = now()->toDateString();
        $todayTransfers = $transfers->filter(function ($t) {
            return $t->created_at->toDateString() === now()->toDateString();
        })->count();

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
            'alerts' => $alerts,
        ]);
    }
}
