<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use App\Models\Transfer;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportController extends Controller
{
    public function summary(Request $request)
    {
        $warehouseCount = Warehouse::count();
        $inventoryCount = InventoryItem::count();
        $lowStockCount = InventoryItem::whereColumn('quantity', '<=', 'reorderPoint')->count();
        $outOfStockCount = InventoryItem::where('quantity', 0)->count();
        $transferCount = Transfer::count();
        $totalValue = InventoryItem::sum(DB::raw('quantity * unitPrice'));
        $unassignedCount = InventoryItem::whereNull('warehouseId')->count();

        $alerts = InventoryItem::with('warehouse')
            ->where(function ($query) {
                $query->where('quantity', 0)
                    ->orWhereColumn('quantity', '<=', 'reorderPoint');
            })
            ->orderByRaw('quantity ASC, reorderPoint DESC')
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'sku' => $item->sku,
                    'name' => $item->name,
                    'quantity' => $item->quantity,
                    'reorderPoint' => $item->reorderPoint,
                    'status' => $item->quantity === 0 ? 'out_of_stock' : 'low_stock',
                    'warehouseName' => $item->warehouse?->name ?? 'Unassigned',
                ];
            });

        return response()->json([
            'warehouseCount' => $warehouseCount,
            'inventoryCount' => $inventoryCount,
            'lowStockCount' => $lowStockCount,
            'outOfStockCount' => $outOfStockCount,
            'transferCount' => $transferCount,
            'unassignedCount' => $unassignedCount,
            'totalValue' => round((float) $totalValue, 2),
            'alerts' => $alerts,
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
                'status' => $item->quantity === 0 ? 'out_of_stock' : 'low_stock',
            ];
        }));
    }

    public function stockMovement(Request $request)
    {
        $end = Carbon::now()->startOfMonth();
        $start = (clone $end)->subMonths(6)->startOfMonth();

        $monthExpression = DB::getDriverName() === 'sqlite'
            ? "strftime('%Y-%m', createdAt)"
            : "DATE_FORMAT(createdAt, '%Y-%m')";

        $rows = DB::table('stock_transactions')
            ->selectRaw("{$monthExpression} as ym, transactionType, SUM(quantity) as qty")
            ->whereBetween('createdAt', [$start->toDateString(), $end->endOfMonth()->toDateString()])
            ->groupBy('ym', 'transactionType')
            ->get();

        $map = [];
        foreach ($rows as $r) {
            $map[$r->ym][$r->transactionType] = (int) $r->qty;
        }

        $data = [];
        $cur = clone $start;
        while ($cur->lte($end)) {
            $key = $cur->format('Y-m');
            $label = $cur->format('M');
            $in = $map[$key]['stock_in'] ?? 0;
            $out = $map[$key]['stock_out'] ?? 0;
            $data[] = ['month' => $label, 'inbound' => (int) $in, 'outbound' => (int) $out];
            $cur->addMonth();
        }

        return response()->json($data);
    }

    public function categoryDistribution(Request $request)
    {
        $rows = InventoryItem::selectRaw('category, SUM(quantity * unitPrice) as total')
            ->groupBy('category')
            ->get();

        $total = $rows->sum('total') ?: 1;

        $data = $rows->map(function ($r) use ($total) {
            return [
                'name' => $r->category ?: 'Uncategorized',
                'value' => round(((float) $r->total / (float) $total) * 100, 1),
                'raw' => (float) $r->total,
            ];
        })->values();

        return response()->json($data);
    }
}
