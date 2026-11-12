<?php

namespace App\Http\Controllers;

use App\Models\Transfer;
use App\Models\InventoryItem;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use App\Services\InventoryNotificationService;
use App\Services\InventorySynchronizationService;

class TransferController extends Controller
{
    public function __construct(
        protected InventoryNotificationService $notifications,
        protected InventorySynchronizationService $sync,
    )
    {
    }

    public function page(Request $request)
    {
        $search = trim((string) $request->query('search', ''));
        $status = trim((string) $request->query('status', 'all'));

        $transfers = Transfer::with(['item', 'sourceWh', 'destinationWh'])
            ->orderByDesc('createdAt')
            ->get()
            ->map(function ($transfer) {
                return [
                    'id' => (string) $transfer->id,
                    'itemName' => $transfer->itemName,
                    'fromWarehouseId' => (string) $transfer->sourceWarehouse,
                    'toWarehouseId' => (string) $transfer->destinationWarehouse,
                    'quantity' => (int) $transfer->quantity,
                    'initiator' => 'Sarah Chen',
                    'date' => $transfer->createdAt?->toDateString(),
                    'status' => $transfer->status,
                    'sourceWarehouseName' => $transfer->sourceWh?->name,
                    'destinationWarehouseName' => $transfer->destinationWh?->name,
                    'sourceLocation' => $transfer->sourceWh?->location,
                    'destinationLocation' => $transfer->destinationWh?->location,
                ];
            });

        if ($search !== '') {
            $transfers = $transfers->filter(function ($transfer) use ($search) {
                $haystack = strtolower(($transfer['id'] ?? '') . ' ' . ($transfer['itemName'] ?? ''));
                return str_contains($haystack, strtolower($search));
            })->values();
        }

        if ($status !== '' && $status !== 'all') {
            $transfers = $transfers->filter(fn ($transfer) => $transfer['status'] === $status)->values();
        }

        $warehouses = Warehouse::all();
        $inventory = InventoryItem::with('warehouse')->get()->map(function ($item) {
            return $item->toArray() + ['warehouseName' => $item->warehouse?->name];
        });

        return view('transfers.index', [
            'transfers' => $transfers,
            'warehouses' => $warehouses,
            'inventory' => $inventory,
            'search' => $search,
            'status' => $status,
        ]);
    }

    protected function findItem(int $itemId): InventoryItem
    {
        return InventoryItem::lockForUpdate()->findOrFail($itemId);
    }

    protected function decrementSourceQuantity(InventoryItem $item, int $quantity): void
    {
        if ($item->quantity < $quantity) {
            throw new \DomainException('Insufficient stock. Available: '.$item->quantity);
        }

        $item->quantity -= $quantity;
        $item->save();
    }

    protected function restoreSourceQuantity(InventoryItem $item, int $quantity): void
    {
        $item->quantity += $quantity;
        $item->save();
    }

    protected function createOrUpdateDestinationItem(InventoryItem $sourceItem, int $destinationWarehouseId, int $quantity, Transfer $transfer): ?InventoryItem
    {
        if ($quantity <= 0) {
            return null;
        }

        $destinationItem = InventoryItem::where('sku', $sourceItem->sku)
            ->where('warehouseId', $destinationWarehouseId)
            ->lockForUpdate()
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
            return $destinationItem;
        }

        $payload = [
            'sku' => $sourceItem->sku,
            'name' => $sourceItem->name,
            'description' => $sourceItem->description,
            'category' => $sourceItem->category,
            'quantity' => $quantity,
            'reorderPoint' => $sourceItem->reorderPoint,
            'maxStock' => $sourceItem->maxStock,
            'warehouseId' => $destinationWarehouseId,
            'storageLocation' => null,
            'zone' => $transfer->toZone ?: null,
            'rack' => $transfer->toRack ?: null,
            'shelf' => $transfer->toShelf ?: null,
            'assignedAt' => now(),
            'unitPrice' => $sourceItem->unitPrice,
            'supplierId' => $sourceItem->supplierId,
            'lastRestocked' => now()->toDateString(),
            'expiryDate' => $sourceItem->expiryDate,
        ];

        if (Schema::hasColumn('inventory_items', 'unit')) {
            $payload['unit'] = $sourceItem->unit ?? 'pcs';
        }

        return InventoryItem::create($payload);
    }

    protected function applyStatusTransition(Transfer $transfer, string $oldStatus, string $newStatus): array
    {
        $item = $this->findItem($transfer->itemId);

        if ($oldStatus === $newStatus) {
            return [];
        }

        if ($oldStatus !== 'completed' && $newStatus === 'completed') {
            if ((int) $item->warehouseId !== (int) $transfer->sourceWarehouse) {
                throw new \DomainException('Item is no longer in the source warehouse.');
            }

            $this->decrementSourceQuantity($item, $transfer->quantity);
            $destinationItem = $this->createOrUpdateDestinationItem($item, $transfer->destinationWarehouse, $transfer->quantity, $transfer);

            return array_values(array_filter([$item, $destinationItem]));
        }

        return [];
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
            'requestedBy' => 'nullable|string|max:255',
            'approvedBy' => 'nullable|string|max:255',
            'fromZone' => 'nullable|string|max:100',
            'fromRack' => 'nullable|string|max:100',
            'fromShelf' => 'nullable|string|max:100',
            'toZone' => 'nullable|string|max:100',
            'toRack' => 'nullable|string|max:100',
            'toShelf' => 'nullable|string|max:100',
        ]);

        return DB::transaction(function () use ($validated) {
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
                'requestedBy' => $validated['requestedBy'] ?? null,
                'approvedBy' => $validated['approvedBy'] ?? null,
                'fromZone' => $validated['fromZone'] ?? null,
                'fromRack' => $validated['fromRack'] ?? null,
                'fromShelf' => $validated['fromShelf'] ?? null,
                'toZone' => $validated['toZone'] ?? null,
                'toRack' => $validated['toRack'] ?? null,
                'toShelf' => $validated['toShelf'] ?? null,
                'createdAt' => now(),
            ]);

            $affectedItems = $this->applyStatusTransition($transfer, 'pending', $transfer->status);

            if ($transfer->status === 'completed') {
                foreach ($affectedItems as $affectedItem) {
                    $this->sync->reconcileItem($affectedItem, false);
                }
                $transfer->completedAt = now();
                $transfer->save();
                $this->notifications->transferCompleted($transfer->fresh(['item', 'sourceWh', 'destinationWh']));
                foreach ($affectedItems as $affectedItem) {
                    $this->notifications->stockAlertChanged($affectedItem);
                }
            }

            return response()->json($transfer->fresh(['item', 'sourceWh', 'destinationWh']), 201);
        });
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
            'approvedBy' => 'nullable|string|max:255',
        ]);

        try {
            return DB::transaction(function () use ($transfer, $validated) {
                $transfer = Transfer::whereKey($transfer->id)->lockForUpdate()->firstOrFail();
                $oldStatus = $transfer->status;
                $newStatus = $validated['status'] ?? $oldStatus;

                if ($oldStatus === 'completed' && $newStatus !== 'completed') {
                    return response()->json(['error' => 'Completed transfers cannot be changed.'], 422);
                }

                $affectedItems = $this->applyStatusTransition($transfer, $oldStatus, $newStatus);
                $transfer->fill($validated);

                if ($newStatus === 'completed' && !$transfer->completedAt) {
                    foreach ($affectedItems as $affectedItem) {
                        $this->sync->reconcileItem($affectedItem, false);
                    }
                    $transfer->completedAt = now();
                }

                $transfer->save();

                if ($oldStatus !== 'completed' && $newStatus === 'completed') {
                    $this->notifications->transferCompleted($transfer->fresh(['item', 'sourceWh', 'destinationWh']));
                    foreach ($affectedItems as $affectedItem) {
                        $this->notifications->stockAlertChanged($affectedItem);
                    }
                }

                return response()->json($transfer->fresh(['item', 'sourceWh', 'destinationWh']));
            });
        } catch (\DomainException $exception) {
            return response()->json(['error' => $exception->getMessage()], 422);
        }
    }

    public function destroy(Transfer $transfer)
    {
        return DB::transaction(function () use ($transfer) {
            $transfer->delete();
            return response()->json(['ok' => true]);
        });
    }
}
