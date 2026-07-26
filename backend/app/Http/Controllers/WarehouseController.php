<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use App\Models\StockTransaction;
use App\Models\Transfer;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WarehouseController extends Controller
{
    public function page(Request $request)
    {
        $search = trim((string) $request->query('search', ''));

        $warehouses = Warehouse::with('inventoryItems')->get()->map(function ($warehouse) {
            $warehouse->status = $warehouse->computeStatus();
            $warehouse->capacityUsed = $warehouse->inventoryItems->sum('quantity');
            $warehouse->used = $warehouse->capacityUsed;
            return $warehouse->toArray();
        });

        if ($search !== '') {
            $warehouses = $warehouses->filter(function ($warehouse) use ($search) {
                $haystack = strtolower(($warehouse['name'] ?? '') . ' ' . ($warehouse['location'] ?? '') . ' ' . ($warehouse['manager'] ?? ''));
                return str_contains($haystack, strtolower($search));
            })->values();
        }

        $inventory = InventoryItem::with('warehouse')->get()->map(function ($item) {
            return $item->toArray() + ['warehouseName' => $item->warehouse?->name];
        });

        return view('warehouses.index', [
            'warehouses' => $warehouses,
            'inventory' => $inventory,
            'search' => $search,
        ]);
    }

    public function index()
    {
        return response()->json(Warehouse::with('inventoryItems')->get()->map(function ($warehouse) {
            $warehouse->status = $warehouse->computeStatus();
            $warehouse->capacityUsed = $warehouse->inventoryItems->sum('quantity');
            $warehouse->used = $warehouse->capacityUsed;
            return $warehouse->toArray();
        }));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'address' => 'nullable|string|max:500',
            'capacity' => 'required|integer|min:0',
            'manager' => 'nullable|string|max:255',
            'zones' => 'sometimes|array',
        ]);

        $warehouse = Warehouse::create($validated);
        $warehouse->status = $warehouse->computeStatus();
        $warehouse->capacityUsed = 0;
        $warehouse->used = 0;

        return response()->json($warehouse, 201);
    }

    public function show(Warehouse $warehouse)
    {
        $warehouse->status = $warehouse->computeStatus();
        $warehouse->capacityUsed = $warehouse->inventoryItems()->sum('quantity');
        $warehouse->used = $warehouse->capacityUsed;

        return response()->json($warehouse);
    }

    public function update(Request $request, Warehouse $warehouse)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'location' => 'sometimes|string|max:255',
            'address' => 'nullable|string|max:500',
            'capacity' => 'sometimes|integer|min:0',
            'used' => 'sometimes|integer|min:0',
            'manager' => 'sometimes|string|max:255',
            'zones' => 'sometimes|array',
        ]);

        $warehouse->update($validated);
        $warehouse->status = $warehouse->computeStatus();
        $warehouse->capacityUsed = $warehouse->inventoryItems()->sum('quantity');
        $warehouse->used = $warehouse->capacityUsed;

        return response()->json($warehouse);
    }

    public function destroy(Warehouse $warehouse)
    {
        if ($warehouse->inventoryItems()->exists()) {
            return response()->json([
                'error' => 'This warehouse contains inventory and cannot be deleted. Move or remove its items first.',
            ], 422);
        }

        $hasTransferHistory = Transfer::where('sourceWarehouse', $warehouse->id)
            ->orWhere('destinationWarehouse', $warehouse->id)
            ->exists();
        $hasStockHistory = StockTransaction::where('warehouseId', $warehouse->id)->exists();

        if ($hasTransferHistory || $hasStockHistory) {
            return response()->json([
                'error' => 'This warehouse has transaction or transfer history and cannot be deleted.',
            ], 422);
        }

        DB::transaction(function () use ($warehouse) {
            $warehouse->delete();
        });

        return response()->json(['ok' => true]);
    }
}
