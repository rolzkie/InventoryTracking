<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use App\Models\StockTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use App\Models\Warehouse;
use App\Services\InventoryNotificationService;
use App\Services\InventorySynchronizationService;

class StockTransactionController extends Controller
{
    public function __construct(
        protected InventoryNotificationService $notifications,
        protected InventorySynchronizationService $sync,
    )
    {
    }

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
            'supplierId' => 'nullable|string|max:100',
            'purpose' => 'nullable|string|max:100',
            'referenceNumber' => 'nullable|string|max:100',
            'processedBy' => 'nullable|string|max:255',
            'unitCost' => 'sometimes|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $transaction = DB::transaction(function () use ($validated) {
            $item = InventoryItem::lockForUpdate()->findOrFail($validated['itemId']);

            if (!$item->warehouseId) {
                throw ValidationException::withMessages([
                    'itemId' => 'Item must be assigned to a warehouse before stock transactions can be recorded.',
                ]);
            }

            if ($item->warehouseId != $validated['warehouseId']) {
                throw ValidationException::withMessages([
                    'warehouseId' => 'Selected warehouse does not match the item location.',
                ]);
            }

            if ($validated['transactionType'] === 'stock_out' && $item->quantity < $validated['quantity']) {
                throw ValidationException::withMessages([
                    'quantity' => 'Insufficient stock available.',
                ]);
            }

            if ($validated['transactionType'] === 'stock_in') {
                $item->quantity += $validated['quantity'];
                $item->lastRestocked = now();
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
                'supplierId' => $validated['supplierId'] ?? null,
                'purpose' => $validated['purpose'] ?? null,
                'referenceNumber' => $validated['referenceNumber'] ?? null,
                'processedBy' => $validated['processedBy'] ?? null,
                'unitCost' => $validated['unitCost'] ?? $item->unitPrice,
                'notes' => $validated['notes'] ?? '',
                'createdAt' => now(),
            ]);

            $this->sync->reconcileItem($item, false);
            $this->notifications->stockTransactionCreated($transaction->fresh(['item', 'warehouse']));

            return $transaction;
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
            'supplierId' => 'nullable|string|max:100',
            'purpose' => 'nullable|string|max:100',
            'referenceNumber' => 'nullable|string|max:100',
            'processedBy' => 'nullable|string|max:255',
            'unitCost' => 'sometimes|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $oldTransaction = $transaction->replicate();
        $newItemId = $validated['itemId'] ?? $transaction->itemId;
        $newWarehouseId = $validated['warehouseId'] ?? $transaction->warehouseId;
        $newType = $validated['transactionType'] ?? $transaction->transactionType;
        $newQuantity = $validated['quantity'] ?? $transaction->quantity;

        DB::transaction(function () use ($validated, $transaction, $oldTransaction, $newItemId, $newWarehouseId, $newType, $newQuantity) {
            $affectedItemIds = collect();
            $changedStock = $newItemId !== $oldTransaction->itemId || $newWarehouseId !== $oldTransaction->warehouseId || $newType !== $oldTransaction->transactionType || $newQuantity !== $oldTransaction->quantity;

            if ($changedStock) {
                $itemIds = collect([$oldTransaction->itemId, $newItemId])->unique()->sort()->values();
                $affectedItemIds = $itemIds;
                $lockedItems = InventoryItem::whereIn('id', $itemIds)->lockForUpdate()->get()->keyBy('id');
                $oldItem = $lockedItems->get($oldTransaction->itemId);
                $newItem = $lockedItems->get($newItemId);

                if (!$oldItem || !$newItem) {
                    throw ValidationException::withMessages(['itemId' => 'The selected inventory item no longer exists.']);
                }

                if ($oldTransaction->transactionType === 'stock_in') {
                    $oldItem->quantity = max(0, $oldItem->quantity - $oldTransaction->quantity);
                } else {
                    $oldItem->quantity += $oldTransaction->quantity;
                }
                $oldItem->save();

                if (!$newItem->warehouseId) {
                    throw ValidationException::withMessages([
                        'itemId' => 'Item must be assigned to a warehouse before stock transactions can be recorded.',
                    ]);
                }
                if ($newItem->warehouseId != $newWarehouseId) {
                    throw ValidationException::withMessages([
                        'warehouseId' => 'Selected warehouse does not match the item location.',
                    ]);
                }
                if ($newType === 'stock_out' && $newItem->quantity < $newQuantity) {
                    throw ValidationException::withMessages(['quantity' => 'Insufficient stock available for update.']);
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

            $affectedItemIds->each(fn ($itemId) => $this->sync->reconcileItemId((int) $itemId));
        });

        return response()->json($transaction->fresh(['item', 'warehouse']));
    }

    public function destroy(StockTransaction $transaction)
    {
        DB::transaction(function () use ($transaction) {
            $item = InventoryItem::whereKey($transaction->itemId)->lockForUpdate()->first();
            if ($item) {
                if ($transaction->transactionType === 'stock_in') {
                    $item->quantity = max(0, $item->quantity - $transaction->quantity);
                } else {
                    $item->quantity += $transaction->quantity;
                }
                $item->save();
                $this->sync->reconcileItem($item);
            }
            $transaction->delete();
        });

        return response()->json(['ok' => true]);
    }
}
