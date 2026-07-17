<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use App\Models\StockTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Warehouse;

class StockTransactionController extends Controller
{
    public function page(Request $request)
    {
        $warehouses = Warehouse::all(['id', 'name']);
        $inventory = InventoryItem::with('warehouse')->get()->map(function ($item) {
            return $item->toArray() + [
                'warehouseName' => $item->warehouse?->name,
                'warehouse' => $item->warehouse?->toArray(),
            ];
        });

        return view('transactions.index', [
            'warehouses' => $warehouses,
            'inventory' => $inventory,
        ]);
    }

    public function index(Request $request)
    {

        $query = StockTransaction::with(['item', 'warehouse'])->orderByDesc('createdAt');

        if ($request->filled('type')) {
            $query->where('transactionType', $request->input('type'));
        }

        if ($request->filled('warehouseId')) {
            $query->where('warehouseId', $request->input('warehouseId'));
        }

        if ($request->filled('search')) {
            $term = trim($request->input('search'));
            $query->where(function ($builder) use ($term) {
                $builder->whereHas('item', function ($itemQuery) use ($term) {
                    $itemQuery->where('name', 'like', "%{$term}%")->orWhere('sku', 'like', "%{$term}%");
                })
                ->orWhereHas('warehouse', function ($warehouseQuery) use ($term) {
                    $warehouseQuery->where('name', 'like', "%{$term}%");
                })
                ->orWhere('notes', 'like', "%{$term}%");
            });
        }

        return response()->json($query->get());
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

        $transaction = DB::transaction(function () use ($validated, $item) {
            if ($validated['transactionType'] === 'stock_in') {
                $item->quantity += $validated['quantity'];
                $item->lastRestocked = now();
            } else {
                $item->quantity -= $validated['quantity'];
            }
            $item->save();

            return StockTransaction::create([
                'itemId' => $validated['itemId'],
                'warehouseId' => $validated['warehouseId'],
                'transactionType' => $validated['transactionType'],
                'quantity' => $validated['quantity'],
                'expirationDate' => $validated['expirationDate'] ?? null,
                'notes' => $validated['notes'] ?? '',
                'createdAt' => now(),
            ]);
        });

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

        $oldTransaction = $transaction->replicate();
        $newItemId = $validated['itemId'] ?? $transaction->itemId;
        $newWarehouseId = $validated['warehouseId'] ?? $transaction->warehouseId;
        $newType = $validated['transactionType'] ?? $transaction->transactionType;
        $newQuantity = $validated['quantity'] ?? $transaction->quantity;

        DB::transaction(function () use ($validated, $transaction, $oldTransaction, $newItemId, $newWarehouseId, $newType, $newQuantity) {
            $changedStock = $newItemId !== $oldTransaction->itemId || $newWarehouseId !== $oldTransaction->warehouseId || $newType !== $oldTransaction->transactionType || $newQuantity !== $oldTransaction->quantity;

            if ($changedStock) {
                $oldItem = InventoryItem::findOrFail($oldTransaction->itemId);
                if ($oldTransaction->transactionType === 'stock_in') {
                    $oldItem->quantity = max(0, $oldItem->quantity - $oldTransaction->quantity);
                } else {
                    $oldItem->quantity += $oldTransaction->quantity;
                }
                $oldItem->save();

                $newItem = InventoryItem::findOrFail($newItemId);
                if (!$newItem->warehouseId) {
                    throw new \RuntimeException('Item must be assigned to a warehouse before stock transactions can be recorded');
                }
                if ($newItem->warehouseId != $newWarehouseId) {
                    throw new \RuntimeException('Selected warehouse does not match item location');
                }
                if ($newType === 'stock_out' && $newItem->quantity < $newQuantity) {
                    throw new \RuntimeException('Insufficient stock available for update');
                }

                if ($newType === 'stock_in') {
                    $newItem->quantity += $newQuantity;
                    $newItem->lastRestocked = now();
                } else {
                    $newItem->quantity -= $newQuantity;
                }
                $newItem->save();
            }

            $transaction->update($validated);
        });

        return response()->json($transaction->fresh(['item', 'warehouse']));
    }

    public function destroy(StockTransaction $transaction)
    {
        DB::transaction(function () use ($transaction) {
            $item = InventoryItem::find($transaction->itemId);
            if ($item) {
                if ($transaction->transactionType === 'stock_in') {
                    $item->quantity = max(0, $item->quantity - $transaction->quantity);
                } else {
                    $item->quantity += $transaction->quantity;
                }
                $item->save();
            }
            $transaction->delete();
        });

        return response()->json(['ok' => true]);
    }
}
