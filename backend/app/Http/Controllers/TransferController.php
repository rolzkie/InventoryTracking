<?php

namespace App\Http\Controllers;

use App\Models\Transfer;
use App\Models\InventoryItem;
use Illuminate\Http\Request;

class TransferController extends Controller
{
    protected function findItem(int $itemId): InventoryItem
    {
        return InventoryItem::findOrFail($itemId);
    }

    protected function decrementSourceQuantity(InventoryItem $item, int $quantity): void
    {
        $item->quantity = max(0, $item->quantity - $quantity);
        $item->save();
    }

    protected function restoreSourceQuantity(InventoryItem $item, int $quantity): void
    {
        $item->quantity += $quantity;
        $item->save();
    }

    protected function createOrUpdateDestinationItem(InventoryItem $sourceItem, int $destinationWarehouseId, int $quantity, Transfer $transfer): void
    {
        if ($quantity <= 0) {
            return;
        }

        $destinationItem = InventoryItem::where('sku', $sourceItem->sku)
            ->where('warehouseId', $destinationWarehouseId)
            ->first();

        if ($destinationItem) {
            $destinationItem->quantity += $quantity;
            $destinationItem->warehouseId = $destinationWarehouseId;
            $destinationItem->storageLocation = $destinationItem->storageLocation ?: null;
            $destinationItem->zone = $transfer->toZone ?: $destinationItem->zone;
            $destinationItem->rack = $transfer->toRack ?: $destinationItem->rack;
            $destinationItem->shelf = $transfer->toShelf ?: $destinationItem->shelf;
            $destinationItem->assignedAt = $destinationItem->assignedAt ?: now();
            $destinationItem->save();
            return;
        }

        InventoryItem::create([
            'sku' => $sourceItem->sku,
            'name' => $sourceItem->name,
            'description' => $sourceItem->description,
            'category' => $sourceItem->category,
            'quantity' => $quantity,
            'reorderPoint' => $sourceItem->reorderPoint,
            'warehouseId' => $destinationWarehouseId,
            'storageLocation' => null,
            'zone' => $transfer->toZone ?: null,
            'rack' => $transfer->toRack ?: null,
            'shelf' => $transfer->toShelf ?: null,
            'assignedAt' => now(),
            'unitPrice' => $sourceItem->unitPrice,
            'lastRestocked' => now()->toDateString(),
        ]);
    }

    protected function applyStatusTransition(Transfer $transfer, string $oldStatus, string $newStatus): void
    {
        $item = $this->findItem($transfer->itemId);

        if ($oldStatus !== 'in_transit' && $newStatus === 'in_transit') {
            $this->decrementSourceQuantity($item, $transfer->quantity);
        }

        if ($oldStatus !== 'completed' && $newStatus === 'completed') {
            if ($oldStatus !== 'in_transit') {
                $this->decrementSourceQuantity($item, $transfer->quantity);
            }

            $this->createOrUpdateDestinationItem($item, $transfer->destinationWarehouse, $transfer->quantity, $transfer);
        }

        if ($oldStatus === 'in_transit' && $newStatus === 'cancelled') {
            $this->restoreSourceQuantity($item, $transfer->quantity);
        }
    }

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
            'status' => 'required|in:pending,in_transit,completed,cancelled',
            'notes' => 'nullable|string',
            'fromZone' => 'nullable|string|max:100',
            'fromRack' => 'nullable|string|max:100',
            'fromShelf' => 'nullable|string|max:100',
            'toZone' => 'nullable|string|max:100',
            'toRack' => 'nullable|string|max:100',
            'toShelf' => 'nullable|string|max:100',
        ]);

        $item = $this->findItem($validated['itemId']);

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
            'fromZone' => $validated['fromZone'] ?? null,
            'fromRack' => $validated['fromRack'] ?? null,
            'fromShelf' => $validated['fromShelf'] ?? null,
            'toZone' => $validated['toZone'] ?? null,
            'toRack' => $validated['toRack'] ?? null,
            'toShelf' => $validated['toShelf'] ?? null,
            'createdAt' => now(),
        ]);

        $this->applyStatusTransition($transfer, 'pending', $transfer->status);

        if ($transfer->status === 'completed') {
            $transfer->completedAt = now();
            $transfer->save();
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
            'status' => 'sometimes|in:pending,in_transit,completed,cancelled',
            'notes' => 'nullable|string',
        ]);

        $oldStatus = $transfer->status;
        $transfer->update($validated);
        $this->applyStatusTransition($transfer, $oldStatus, $transfer->status);

        if ($transfer->status === 'completed' && !$transfer->completedAt) {
            $transfer->completedAt = now();
            $transfer->save();
        }

        return response()->json($transfer->fresh(['item', 'sourceWh', 'destinationWh']));
    }

    public function destroy(Transfer $transfer)
    {
        if ($transfer->status === 'in_transit') {
            $item = $this->findItem($transfer->itemId);
            $this->restoreSourceQuantity($item, $transfer->quantity);
        }

        $transfer->delete();
        return response()->json(['ok' => true]);
    }
}
