<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use App\Models\Warehouse;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function index()
    {
        return response()->json(
            InventoryItem::with('warehouse')->get()->map(function ($item) {
                return $item->toArray() + ['warehouseName' => $item->warehouse?->name];
            })
        );
    }

    public function page(Request $request)
    {
        $query = InventoryItem::with('warehouse')->orderBy('name');

        $search = trim((string) $request->query('search', ''));
        $status = trim((string) $request->query('status', 'all'));
        $category = trim((string) $request->query('category', 'all'));

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%");
            });
        }

        if ($status !== '' && $status !== 'all') {
            $query->where('status', $status);
        }

        if ($category !== '' && $category !== 'all') {
            $query->where('category', $category);
        }

        $items = $query->get()->map(function ($item) {
            return $item->toArray() + [
                'warehouse' => $item->warehouse?->toArray(),
                'warehouseName' => $item->warehouse?->name,
            ];
        });

        $warehouses = Warehouse::all();
        $categories = InventoryItem::query()->distinct()->pluck('category')->filter()->values();
        $totalValue = $items->sum(fn ($item) => (float) ($item['quantity'] ?? 0) * (float) ($item['unitPrice'] ?? 0));

        return view('inventory.index', [
            'items' => $items,
            'warehouses' => $warehouses,
            'categories' => $categories,
            'search' => $search,
            'status' => $status,
            'category' => $category,
            'totalValue' => $totalValue,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'sku' => 'required|string|unique:inventory_items|max:100',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required|string|max:100',
            'unit' => 'required|string|max:50',
            'quantity' => 'sometimes|integer|min:0',
            'reorderPoint' => 'required|integer|min:0',
            'unitPrice' => 'required|numeric|min:0',
            'expiryDate' => 'nullable|date',
        ]);

        $item = InventoryItem::create([
            'sku' => $validated['sku'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? '',
            'category' => $validated['category'],
            'unit' => $validated['unit'],
            'reorderPoint' => $validated['reorderPoint'],
            'unitPrice' => $validated['unitPrice'],
            'quantity' => $validated['quantity'] ?? 0,
            'warehouseId' => null,
            'storageLocation' => null,
            'status' => 'unassigned',
            'lastRestocked' => null,
            'expiryDate' => $validated['expiryDate'] ?? null,
        ]);


        return response()->json($item->fresh('warehouse')->toArray() + ['warehouseName' => $item->warehouse?->name], 201);
    }

    public function show(InventoryItem $inventory)
    {
        return response()->json($inventory->load('warehouse')->toArray() + ['warehouseName' => $inventory->warehouse?->name]);
    }

    public function update(Request $request, InventoryItem $inventory)
    {
        $validated = $request->validate([
            'sku' => 'sometimes|string|unique:inventory_items,sku,' . $inventory->id . '|max:100',
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'category' => 'sometimes|string|max:100',
            'unit' => 'sometimes|string|max:50',
            'quantity' => 'sometimes|integer|min:0',
            'reorderPoint' => 'sometimes|integer|min:0',
            'unitPrice' => 'sometimes|numeric|min:0',
            'expiryDate' => 'nullable|date',
        ]);


        $inventory->update($validated);

        // Trigger model saving hooks to recompute status (including expiry-based status)
        $inventory->refresh();


        return response()->json($inventory->fresh('warehouse')->toArray() + ['warehouseName' => $inventory->warehouse?->name]);
    }

    public function destroy(InventoryItem $inventory)
    {
        $inventory->delete();
        return response()->json(['ok' => true]);
    }

    public function adjust(Request $request, $id)
    {
        $validated = $request->validate([
            'delta' => 'required|integer',
        ]);

        $item = InventoryItem::findOrFail($id);

        if (!$item->warehouseId) {
            return response()->json(['error' => 'Cannot adjust stock for an unassigned item. Assign a warehouse first.'], 422);
        }

        $item->quantity = max(0, $item->quantity + $validated['delta']);
        $item->save();

        return response()->json($item->fresh('warehouse')->toArray() + ['warehouseName' => $item->warehouse?->name]);
    }

    public function assign(Request $request, $id)
    {
        $validated = $request->validate([
            'warehouseId' => 'required|exists:warehouses,id',
            'storageLocation' => 'nullable|string|max:255',
            'zone' => 'nullable|string|max:100',
            'rack' => 'nullable|string|max:100',
            'shelf' => 'nullable|string|max:100',
        ]);

        $item = InventoryItem::findOrFail($id);

        if ($item->warehouseId && $item->warehouseId != $validated['warehouseId']) {
            return response()->json(['error' => 'Item already assigned to another warehouse. Use transfer instead.'], 422);
        }

        $item->warehouseId = $validated['warehouseId'];
        $item->storageLocation = $validated['storageLocation'] ?? null;
        $item->zone = $validated['zone'] ?? null;
        $item->rack = $validated['rack'] ?? null;
        $item->shelf = $validated['shelf'] ?? null;
        $item->assignedAt = now();
        if ($item->quantity === 0) {
            $item->status = 'out_of_stock';
        } elseif ($item->quantity < $item->reorderPoint) {
            $item->status = 'low_stock';
        } else {
            $item->status = 'in_stock';
        }
        $item->save();

        return response()->json($item->fresh('warehouse')->toArray() + ['warehouseName' => $item->warehouse?->name]);
    }
}
