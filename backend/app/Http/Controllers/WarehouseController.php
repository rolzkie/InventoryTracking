<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use App\Models\Warehouse;
use Illuminate\Http\Request;

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
            'capacity' => 'required|integer|min:0',
            'manager' => 'required|string|max:255',
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
            'capacity' => 'sometimes|integer|min:0',
            'used' => 'sometimes|integer|min:0',
            'manager' => 'sometimes|string|max:255',
        ]);

        $warehouse->update($validated);
        $warehouse->status = $warehouse->computeStatus();
        $warehouse->capacityUsed = $warehouse->inventoryItems()->sum('quantity');
        $warehouse->used = $warehouse->capacityUsed;

        return response()->json($warehouse);
    }

    public function destroy(Warehouse $warehouse)
    {
        $warehouse->delete();
        return response()->json(['ok' => true]);
    }
}
