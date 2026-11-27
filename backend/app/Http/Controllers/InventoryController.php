<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use App\Models\StockTransaction;
use App\Models\Supplier;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\InventoryActivityLogger;
use App\Services\InventoryNotificationService;
use App\Services\InventorySynchronizationService;
use App\Services\StockTransactionReferenceService;
use App\Support\ApplicationTimezone;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Carbon\CarbonInterface;

class InventoryController extends Controller
{
    public function __construct(
        protected InventoryNotificationService $notifications,
        protected InventorySynchronizationService $sync,
        protected InventoryActivityLogger $activityLogger,
        protected StockTransactionReferenceService $references,
    )
    {
    }

    protected function supportsUnitColumn(): bool
    {
        return Schema::hasColumn('inventory_items', 'unit');
    }

    protected function resolveSupplierId(?string $supplierId, ?string $supplierName): ?string
    {
        $supplierName = trim((string) $supplierName);

        if ($supplierName !== '') {
            $normalized = mb_strtolower($supplierName);
            $supplier = Supplier::whereRaw('LOWER(TRIM(name)) = ?', [$normalized])->first();

            if (!$supplier) {
                $supplier = Supplier::create(['name' => $supplierName]);
            }

            return (string) $supplier->id;
        }

        return $supplierId !== null && $supplierId !== '' ? (string) $supplierId : null;
    }

    protected function generateSku(?CarbonInterface $date = null): string
    {
        $day = ($date ?? now(ApplicationTimezone::name()))
            ->copy()
            ->setTimezone(ApplicationTimezone::name())
            ->format('Ymd');
        $base = "SKU-{$day}-";

        $latest = InventoryItem::query()
            ->where('sku', 'like', $base.'%')
            ->orderByDesc('sku')
            ->value('sku');

        $next = 1;
        if (is_string($latest) && preg_match('/-(\d{4})$/', $latest, $matches)) {
            $next = ((int) $matches[1]) + 1;
        }

        return sprintf('%s%04d', $base, $next);
    }

    public function assignable()
    {
        return response()->json(
            InventoryItem::with('warehouse')
                ->whereNull('warehouseId')
                ->whereNotNull('sku')
                ->whereNotNull('name')
                ->where('sku', '<>', '')
                ->where('name', '<>', '')
                ->where('status', '<>', 'deleted')
                ->orderBy('name')
                ->get()
                ->map(function ($item) {
                    return $item->toArray() + ['warehouseName' => $item->warehouse?->name];
                })
        );
    }

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
            'sku' => ['nullable', 'string', 'max:100', Rule::unique('inventory_items', 'sku')],
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required|string|max:100',
            'unit' => $this->supportsUnitColumn() ? 'required|string|max:50' : 'nullable|string|max:50',
            'quantity' => 'sometimes|integer|min:0',
            'reorderPoint' => 'required|integer|min:0',
            'maxStock' => 'sometimes|integer|min:0',
            'unitPrice' => 'required|numeric|min:0',
            'supplierId' => 'nullable|exists:suppliers,id',
            'supplierName' => 'nullable|string|max:255',
            'expiryDate' => 'nullable|date',
        ]);

        $supplierId = $this->resolveSupplierId(
            $validated['supplierId'] ?? null,
            $validated['supplierName'] ?? null,
        );

        $sku = trim((string) ($validated['sku'] ?? ''));
        if ($sku === '') {
            $sku = $this->generateSku();
        }

        $payload = [
            'sku' => $sku,
            'name' => $validated['name'],
            'description' => $validated['description'] ?? '',
            'category' => $validated['category'],
            'reorderPoint' => $validated['reorderPoint'],
            'maxStock' => $validated['maxStock'] ?? 0,
            'unitPrice' => $validated['unitPrice'],
            'supplierId' => $supplierId,
            'quantity' => $validated['quantity'] ?? 0,
            'warehouseId' => null,
            'storageLocation' => null,
            'status' => 'unassigned',
            'lastRestocked' => null,
            'expiryDate' => $validated['expiryDate'] ?? null,
        ];

        if ($this->supportsUnitColumn()) {
            $payload['unit'] = $validated['unit'] ?? 'pcs';
        }

        $item = DB::transaction(function () use ($payload, $request) {
            $item = InventoryItem::create($payload);
            $this->notifications->inventoryUpdated($item);
            $quantity = (int) $item->quantity;
            $this->activityLogger->log($request, 'inventory_created', 'inventory_item', $item->id, [
                'previous' => ['quantity' => 0],
                'updated' => ['sku' => $item->sku, 'name' => $item->name, 'category' => $item->category, 'quantity' => $quantity],
                'quantityChange' => ['from' => 0, 'to' => $quantity, 'delta' => $quantity],
                'note' => 'Initial quantity is recorded as opening stock when the product is assigned to a department storage location.',
            ]);

            return $item;
        });

        return response()->json($item->fresh('warehouse')->toArray() + ['warehouseName' => $item->warehouse?->name], 201);
    }

    public function show(InventoryItem $inventory)
    {
        return response()->json($inventory->load('warehouse')->toArray() + ['warehouseName' => $inventory->warehouse?->name]);
    }

    public function update(Request $request, InventoryItem $inventory)
    {
        $actor = $request->attributes->get('authenticatedUser');
        abort_if($actor?->role !== 'admin' && $request->exists('quantity'), 403, 'Staff must use stock transactions to change item quantities.');

        $validated = $request->validate([
            'sku' => ['sometimes', 'nullable', 'string', 'max:100'],
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'category' => 'sometimes|string|max:100',
            'unit' => $this->supportsUnitColumn() ? 'sometimes|string|max:50' : 'nullable|string|max:50',
            'quantity' => 'sometimes|integer|min:0',
            'reorderPoint' => 'sometimes|integer|min:0',
            'maxStock' => 'sometimes|integer|min:0',
            'unitPrice' => 'sometimes|numeric|min:0',
            'adjustmentReason' => 'sometimes|nullable|string|min:3|max:500',
            'supplierId' => 'nullable|exists:suppliers,id',
            'supplierName' => 'nullable|string|max:255',
            'expiryDate' => 'nullable|date',
        ]);

        $supplierId = $this->resolveSupplierId(
            $validated['supplierId'] ?? null,
            $validated['supplierName'] ?? null,
        );

        if (array_key_exists('supplierId', $validated) || array_key_exists('supplierName', $validated)) {
            $validated['supplierId'] = $supplierId;
        }


        if (!$this->supportsUnitColumn()) {
            unset($validated['unit']);
        }

        if (array_key_exists('sku', $validated)) {
            $validated['sku'] = trim($validated['sku']);
        }

        DB::transaction(function () use ($inventory, $validated, $request, $actor) {
            $inventory = InventoryItem::whereKey($inventory->id)->lockForUpdate()->firstOrFail();
            $previous = [
                'sku' => $inventory->sku,
                'name' => $inventory->name,
                'category' => $inventory->category,
                'quantity' => (int) $inventory->quantity,
                'warehouseId' => $inventory->warehouseId,
                'reorderPoint' => (int) $inventory->reorderPoint,
                'maxStock' => (int) $inventory->maxStock,
                'unitPrice' => (float) $inventory->unitPrice,
            ];
            $oldQuantity = (int) $inventory->quantity;
            $newQuantity = array_key_exists('quantity', $validated) ? (int) $validated['quantity'] : $oldQuantity;
            $quantityChanged = $newQuantity !== $oldQuantity;
            $reason = trim((string) ($validated['adjustmentReason'] ?? ''));

            if ($quantityChanged && ! $inventory->warehouseId) {
                throw ValidationException::withMessages(['quantity' => 'Assign the product to a department storage location before changing its quantity.']);
            }
            if ($quantityChanged && $reason === '') {
                throw ValidationException::withMessages(['adjustmentReason' => 'Provide a reason for the stock adjustment.']);
            }

            unset($validated['adjustmentReason']);
            $inventory->update($validated);

            if ($quantityChanged) {
                $this->createAdjustmentTransaction($inventory, $oldQuantity, $newQuantity, $reason, $actor);
            }

            $this->notifications->inventoryUpdated($inventory);
            $inventory = $this->sync->reconcileItem($inventory, false);
            $updated = [
                'sku' => $inventory->sku,
                'name' => $inventory->name,
                'category' => $inventory->category,
                'quantity' => (int) $inventory->quantity,
                'warehouseId' => $inventory->warehouseId,
                'reorderPoint' => (int) $inventory->reorderPoint,
                'maxStock' => (int) $inventory->maxStock,
                'unitPrice' => (float) $inventory->unitPrice,
            ];
            $details = ['previous' => $previous, 'updated' => $updated];
            if ($quantityChanged) {
                $details['quantityChange'] = ['from' => $oldQuantity, 'to' => $newQuantity, 'delta' => $newQuantity - $oldQuantity];
                $details['reason'] = $reason;
            }
            $this->activityLogger->log($request, $quantityChanged ? 'inventory_quantity_adjusted' : 'inventory_updated', 'inventory_item', $inventory->id, $details);
        });

        return response()->json($inventory->fresh('warehouse')->toArray() + ['warehouseName' => $inventory->warehouse?->name]);
    }

    public function destroy(Request $request, InventoryItem $inventory)
    {
        $actor = $request->attributes->get('authenticatedUser');
        abort_if(
            !$actor || $actor->role === 'viewer' || $actor->permission === 'view',
            403,
            'Only staff and administrators can archive inventory records.',
        );

        return DB::transaction(function () use ($inventory, $request) {
            $inventory = InventoryItem::whereKey($inventory->id)->lockForUpdate()->firstOrFail();
            $this->activityLogger->log($request, 'inventory_archived', 'inventory_item', $inventory->id, [
                'previous' => [
                    'sku' => $inventory->sku,
                    'name' => $inventory->name,
                    'category' => $inventory->category,
                    'quantity' => (int) $inventory->quantity,
                    'warehouseId' => $inventory->warehouseId,
                ],
                'updated' => null,
            ]);
            // Keep the row so its stock transactions, borrow records, and
            // transfers remain available for audit and return processing.
            $inventory->delete();

            return response()->json(['ok' => true]);
        });
    }

    public function adjust(Request $request, $id)
    {
        $this->authorizeAdministrator($request, 'Only administrators can make direct stock adjustments.');

        $validated = $request->validate([
            'delta' => 'required|integer|not_in:0',
            'reason' => 'required|string|min:3|max:500',
        ]);

        $actor = $request->attributes->get('authenticatedUser');
        $item = DB::transaction(function () use ($id, $validated, $request, $actor) {
            $item = InventoryItem::whereKey($id)->lockForUpdate()->firstOrFail();

            if (!$item->warehouseId) {
                return null;
            }

            $previousQuantity = (int) $item->quantity;
            $updatedQuantity = $previousQuantity + (int) $validated['delta'];
            if ($updatedQuantity < 0) {
                throw ValidationException::withMessages([
                    'delta' => 'The adjustment cannot reduce available stock below zero.',
                ]);
            }

            $item->quantity = $updatedQuantity;
            $item->save();
            $transaction = $this->createAdjustmentTransaction($item, $previousQuantity, $updatedQuantity, trim($validated['reason']), $actor);
            $item = $this->sync->reconcileItem($item);
            $this->activityLogger->log($request, 'inventory_quantity_adjusted', 'inventory_item', $item->id, [
                'previous' => ['quantity' => $previousQuantity],
                'updated' => ['quantity' => $updatedQuantity],
                'quantityChange' => ['from' => $previousQuantity, 'to' => $updatedQuantity, 'delta' => $updatedQuantity - $previousQuantity],
                'reason' => trim($validated['reason']),
                'stockTransactionId' => $transaction->id,
            ]);

            return $item;
        });

        if (!$item) {
            return response()->json(['error' => 'Cannot adjust stock for an unassigned product. Assign a department storage location first.'], 422);
        }

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

        $actor = $request->attributes->get('authenticatedUser');
        $item = DB::transaction(function () use ($id, $validated, $request, $actor) {
            $item = InventoryItem::whereKey($id)->lockForUpdate()->firstOrFail();

            if ($item->warehouseId && $item->warehouseId != $validated['warehouseId']) {
                return null;
            }

            $previousWarehouseId = $item->warehouseId;
            $openingQuantity = (int) $item->quantity;
            $wasUnassigned = $previousWarehouseId === null;
            $item->warehouseId = $validated['warehouseId'];
            $item->storageLocation = $validated['storageLocation'] ?? null;
            $item->zone = $validated['zone'] ?? null;
            $item->rack = $validated['rack'] ?? null;
            $item->shelf = $validated['shelf'] ?? null;
            $item->assignedAt = now();
            $item->save();

            $item = $this->sync->reconcileItem($item, false);
            $this->notifications->inventoryAssigned($item);

            $stockTransactionId = null;
            if ($wasUnassigned && $openingQuantity > 0) {
                $now = now();
                $stockTransaction = StockTransaction::create([
                    'itemId' => $item->id,
                    'userId' => $actor->id,
                    'warehouseId' => $item->warehouseId,
                    'transactionType' => 'stock_in',
                    'quantity' => $openingQuantity,
                    'purpose' => 'opening_balance',
                    'referenceNumber' => $this->references->generate('stock_in', $now),
                    'processedBy' => $actor->name.' (#'.$actor->id.')',
                    'unitCost' => $item->unitPrice,
                    'notes' => 'Opening balance recorded when product was assigned to a department storage location.',
                    'createdAt' => $now,
                ]);
                $stockTransactionId = $stockTransaction->id;
            }
            $this->activityLogger->log($request, 'inventory_assigned', 'inventory_item', $item->id, [
                'previous' => ['warehouseId' => $previousWarehouseId, 'quantity' => $openingQuantity],
                'updated' => ['warehouseId' => $item->warehouseId, 'quantity' => (int) $item->quantity],
                'quantityChange' => ['from' => $openingQuantity, 'to' => (int) $item->quantity, 'delta' => (int) $item->quantity - $openingQuantity],
                'stockTransactionId' => $stockTransactionId,
            ]);

            return $item;
        });

        if (!$item) {
            return response()->json(['error' => 'Product is already assigned to another department storage location. Use a transfer instead.'], 422);
        }

        return response()->json($item->fresh('warehouse')->toArray() + ['warehouseName' => $item->warehouse?->name]);
    }

    private function createAdjustmentTransaction(InventoryItem $item, int $previousQuantity, int $updatedQuantity, string $reason, User $actor): StockTransaction
    {
        $delta = $updatedQuantity - $previousQuantity;
        $type = $delta > 0 ? 'stock_in' : 'stock_out';
        $now = now();

        return StockTransaction::create([
            'itemId' => $item->id,
            'userId' => $actor->id,
            'warehouseId' => $item->warehouseId,
            'transactionType' => $type,
            'quantity' => abs($delta),
            'purpose' => 'adjustment',
            'referenceNumber' => $this->references->generate($type, $now),
            'processedBy' => $actor->name.' (#'.$actor->id.')',
            'unitCost' => $item->unitPrice,
            'notes' => 'Administrator stock adjustment. Reason: '.$reason.'. Quantity: '.$previousQuantity.' -> '.$updatedQuantity.'.',
            'createdAt' => $now,
        ]);
    }
}
