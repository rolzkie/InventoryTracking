<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use App\Models\StockTransaction;
use Illuminate\Http\Request;

class StockTransactionController extends Controller
{
    public function index()
    {
        return response()->json(StockTransaction::with(['item', 'warehouse'])->orderByDesc('createdAt')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'itemId' => 'required|exists:inventory_items,id',
            'warehouseId' => 'required|exists:warehouses,id',
            'transactionType' => 'required|in:stock_in,stock_out',
            'quantity' => 'required|integer|min:1',
            'expirationDate' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $item = InventoryItem::findOrFail($validated['itemId']);
        if (!$item->warehouseId) {
            return response()->json(['error' => 'Item must be assigned to a warehouse before stock transactions can be recorded'], 422);
        }

        if ($item->warehouseId != $validated['warehouseId']) {
            return response()->json(['error' => 'Selected warehouse does not match item location'], 422);
        }

        if ($validated['transactionType'] === 'stock_out' && $item->quantity < $validated['quantity']) {
            return response()->json(['error' => 'Insufficient stock available'], 422);
        }

        if ($validated['transactionType'] === 'stock_in') {
            $item->quantity += $validated['quantity'];
        } else {
            $item->quantity -= $validated['quantity'];
        }
        $item->save();

        $transaction = StockTransaction::create([
            'itemId' => $validated['itemId'],
            'warehouseId' => $validated['warehouseId'],
            'transactionType' => $validated['transactionType'],
            'quantity' => $validated['quantity'],
            'expirationDate' => $validated['expirationDate'] ?? null,
            'notes' => $validated['notes'] ?? '',
            'createdAt' => now(),
        ]);

        return response()->json($transaction->fresh(['item', 'warehouse']), 201);
    }

    public function update(Request $request, StockTransaction $transaction)
    {
        $validated = $request->validate([
            'itemId' => 'sometimes|exists:inventory_items,id',
            'warehouseId' => 'sometimes|exists:warehouses,id',
            'transactionType' => 'sometimes|in:stock_in,stock_out',
            'quantity' => 'sometimes|integer|min:1',
            'expirationDate' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $transaction->update($validated);

        return response()->json($transaction->fresh(['item', 'warehouse']));
    }

    public function destroy(StockTransaction $transaction)
    {
        return response()->json(['ok' => true]);
    }
}
