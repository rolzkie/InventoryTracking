<?php

namespace App\Http\Controllers;

use App\Models\Transfer;
use App\Models\InventoryItem;
use Illuminate\Http\Request;

class TransferController extends Controller
{
    public function index()
    {
        return response()->json(Transfer::with(['item', 'sourceWh', 'destinationWh'])->orderByDesc('created_at')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'sourceWarehouse' => 'required|exists:warehouses,id',
            'destinationWarehouse' => 'required|exists:warehouses,id|different:sourceWarehouse',
            'itemId' => 'required|exists:inventory_items,id',
            'quantity' => 'required|integer|min:1',
            'status' => 'required|in:pending,in_transit,completed',
            'notes' => 'nullable|string',
        ]);

        $item = InventoryItem::findOrFail($validated['itemId']);

        if ($item->warehouseId != $validated['sourceWarehouse']) {
            return response()->json(['error' => 'Item not in source warehouse'], 422);
        }

        if ($item->quantity < $validated['quantity']) {
            return response()->json(
                ['error' => 'Insufficient stock. Available: ' . $item->quantity],
                422
            );
        }

        $transfer = Transfer::create([
            'sourceWarehouse' => $validated['sourceWarehouse'],
            'destinationWarehouse' => $validated['destinationWarehouse'],
            'itemId' => $validated['itemId'],
            'itemName' => $item->name,
            'quantity' => $validated['quantity'],
            'status' => $validated['status'],
            'notes' => $validated['notes'] ?? '',
            'createdAt' => now(),
        ]);

        if ($transfer->status === 'in_transit' || $transfer->status === 'completed') {
            $item->quantity -= $transfer->quantity;
            $item->save();
        }

        return response()->json($transfer->fresh(['item', 'sourceWh', 'destinationWh']), 201);
    }

    public function show(Transfer $transfer)
    {
        return response()->json($transfer->load(['item', 'sourceWh', 'destinationWh']));
    }

    public function update(Request $request, Transfer $transfer)
    {
        $validated = $request->validate([
            'status' => 'sometimes|in:pending,in_transit,completed',
            'notes' => 'nullable|string',
        ]);

        $oldStatus = $transfer->status;
        $transfer->update($validated);

        if ($validated['status'] === 'completed' && $oldStatus !== 'completed') {
            $item = InventoryItem::findOrFail($transfer->itemId);
            $item->warehouseId = $transfer->destinationWarehouse;
            $item->quantity += $transfer->quantity;
            $item->save();
            $transfer->completedAt = now();
            $transfer->save();
        }

        return response()->json($transfer->fresh(['item', 'sourceWh', 'destinationWh']));
    }

    public function destroy(Transfer $transfer)
    {
        if ($transfer->status === 'in_transit' || $transfer->status === 'completed') {
            $item = InventoryItem::findOrFail($transfer->itemId);
            $item->quantity += $transfer->quantity;
            $item->save();
        }

        $transfer->delete();
        return response()->json(['ok' => true]);
    }
}
