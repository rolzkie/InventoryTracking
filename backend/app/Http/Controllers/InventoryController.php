<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use App\Models\Warehouse;
use App\Services\InventoryNotificationService;
use App\Services\InventorySynchronizationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class InventoryController extends Controller
{
    public function __construct(
        protected InventoryNotificationService $notifications,
        protected InventorySynchronizationService $sync,
    )
    {
    }

    protected function supportsUnitColumn(): bool
    {
        return Schema::hasColumn('inventory_items', 'unit');
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
            'sku' => 'required|string|unique:inventory_items|max:100',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required|string|max:100',
            'unit' => $this->supportsUnitColumn() ? 'required|string|max:50' : 'nullable|string|max:50',
            'quantity' => 'sometimes|integer|min:0',
            'reorderPoint' => 'required|integer|min:0',
            'maxStock' => 'sometimes|integer|min:0',
            'unitPrice' => 'required|numeric|min:0',
            'supplierId' => 'nullable|string|max:100',
            'expiryDate' => 'nullable|date',
        ]);

        $payload = [
            'sku' => $validated['sku'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? '',
            'category' => $validated['category'],
            'reorderPoint' => $validated['reorderPoint'],
            'maxStock' => $validated['maxStock'] ?? 0,
            'unitPrice' => $validated['unitPrice'],
            'supplierId' => $validated['supplierId'] ?? null,
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

        $item = DB::transaction(function () use ($payload) {
            $item = InventoryItem::create($payload);
            $this->notifications->inventoryUpdated($item);

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
        $validated = $request->validate([
            'sku' => [
                'sometimes',
                'string',
                'max:100',
                Rule::unique('inventory_items', 'sku')
                    ->ignore($inventory->id)
                    ->where(fn ($query) => $query->where('warehouseId', $inventory->warehouseId)),
            ],
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'category' => 'sometimes|string|max:100',
            'unit' => $this->supportsUnitColumn() ? 'sometimes|string|max:50' : 'nullable|string|max:50',
            'quantity' => 'sometimes|integer|min:0',
            'reorderPoint' => 'sometimes|integer|min:0',
            'maxStock' => 'sometimes|integer|min:0',
            'unitPrice' => 'sometimes|numeric|min:0',
            'supplierId' => 'nullable|string|max:100',
            'expiryDate' => 'nullable|date',
        ]);


        if (!$this->supportsUnitColumn()) {
            unset($validated['unit']);
        }

        DB::transaction(function () use ($inventory, $validated) {
            $inventory = InventoryItem::whereKey($inventory->id)->lockForUpdate()->firstOrFail();
            $inventory->update($validated);
            $this->notifications->inventoryUpdated($inventory);
        });

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

        $item = DB::transaction(function () use ($id, $validated) {
            $item = InventoryItem::whereKey($id)->lockForUpdate()->firstOrFail();

            if (!$item->warehouseId) {
                return null;
            }

            $item->quantity = max(0, $item->quantity + $validated['delta']);
            $item->save();

            return $this->sync->reconcileItem($item);
        });

        if (!$item) {
            return response()->json(['error' => 'Cannot adjust stock for an unassigned item. Assign a warehouse first.'], 422);
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

        $item = DB::transaction(function () use ($id, $validated) {
            $item = InventoryItem::whereKey($id)->lockForUpdate()->firstOrFail();

            if ($item->warehouseId && $item->warehouseId != $validated['warehouseId']) {
                return null;
            }

            $item->warehouseId = $validated['warehouseId'];
            $item->storageLocation = $validated['storageLocation'] ?? null;
            $item->zone = $validated['zone'] ?? null;
            $item->rack = $validated['rack'] ?? null;
            $item->shelf = $validated['shelf'] ?? null;
            $item->assignedAt = now();
            $item->save();

            $item = $this->sync->reconcileItem($item, false);
            $this->notifications->inventoryAssigned($item);

            return $item;
        });

        if (!$item) {
            return response()->json(['error' => 'Item already assigned to another warehouse. Use transfer instead.'], 422);
        }

        return response()->json($item->fresh('warehouse')->toArray() + ['warehouseName' => $item->warehouse?->name]);
    }
}
