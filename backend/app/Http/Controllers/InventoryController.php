<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function index()
    {
        return response()->json(InventoryItem::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'sku' => 'required|string|unique:inventory_items|max:100',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required|string|max:100',
            'quantity' => 'required|integer|min:0',
            'reorderPoint' => 'required|integer|min:0',
            'warehouseId' => 'required|exists:warehouses,id',
            'unitPrice' => 'required|numeric|min:0',
        ]);

        $validated['lastRestocked'] = now()->toDateString();
        $item = InventoryItem::create($validated);
        return response()->json($item, 201);
    }

    public function show(InventoryItem $inventoryItem)
    {
        return response()->json($inventoryItem);
    }

    public function update(Request $request, InventoryItem $inventoryItem)
    {
        $validated = $request->validate([
            'sku' => 'sometimes|string|unique:inventory_items,sku,' . $inventoryItem->id . '|max:100',
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'category' => 'sometimes|string|max:100',
            'quantity' => 'sometimes|integer|min:0',
            'reorderPoint' => 'sometimes|integer|min:0',
            'warehouseId' => 'sometimes|exists:warehouses,id',
            'unitPrice' => 'sometimes|numeric|min:0',
        ]);

        $inventoryItem->update($validated);
        return response()->json($inventoryItem);
    }

    public function destroy(InventoryItem $inventoryItem)
    {
        $inventoryItem->delete();
        return response()->json(['ok' => true]);
    }

    public function adjust(Request $request, $id)
    {
        $validated = $request->validate([
            'delta' => 'required|integer',
        ]);

        $item = InventoryItem::findOrFail($id);
        $item->quantity = max(0, $item->quantity + $validated['delta']);
        $item->save();

        return response()->json($item);
    }
}
