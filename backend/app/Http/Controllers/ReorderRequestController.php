<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use App\Models\ReorderRequest;
use App\Models\StockTransaction;
use App\Services\InventoryNotificationService;
use App\Services\InventoryActivityLogger;
use App\Services\InventorySynchronizationService;
use App\Services\StockTransactionReferenceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ReorderRequestController extends Controller
{
    public function __construct(
        protected InventoryNotificationService $notifications,
        protected InventorySynchronizationService $sync,
        protected StockTransactionReferenceService $references,
    )
    {
    }

    public function index()
    {
        return response()->json(
            ReorderRequest::with(['item', 'supplier'])->orderByDesc('created_at')->get(),
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'itemId' => ['required', 'exists:inventory_items,id'],
            'supplierId' => ['nullable', 'exists:suppliers,id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'status' => ['sometimes', Rule::in(['pending', 'approved', 'ordered', 'received'])],
            'estimatedDelivery' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        $reorder = DB::transaction(function () use ($validated) {
            $hasOpenRequest = ReorderRequest::where('itemId', $validated['itemId'])
                ->whereIn('status', ['pending', 'approved', 'ordered'])
                ->lockForUpdate()
                ->exists();

            if ($hasOpenRequest) {
                return null;
            }

            $validated['status'] = 'pending';

            $reorder = ReorderRequest::create($validated)->fresh(['item', 'supplier']);
            $this->notifications->reorderCreated($reorder);

            return $reorder;
        });

        if (!$reorder) {
            return response()->json(['message' => 'An open reorder already exists for this item.'], 422);
        }

        return response()->json($reorder, 201);
    }

    public function update(Request $request, ReorderRequest $reorder, InventoryActivityLogger $activityLogger)
    {
        $validated = $request->validate([
            'quantity' => ['sometimes', 'integer', 'min:1'],
            'status' => ['sometimes', Rule::in(['pending', 'approved', 'ordered', 'received'])],
            'estimatedDelivery' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        $reorder = DB::transaction(function () use ($reorder, $validated, $request, $activityLogger) {
            $reorder = ReorderRequest::whereKey($reorder->id)->lockForUpdate()->firstOrFail();
            $oldStatus = $reorder->status;
            $newStatus = $validated['status'] ?? $oldStatus;

            if ($oldStatus === 'received' && $validated !== []) {
                throw ValidationException::withMessages([
                    'status' => 'Received reorders are already applied to inventory and cannot be changed.',
                ]);
            }

            $reorder->update($validated);

            if ($oldStatus !== 'received' && $newStatus === 'received') {
                $item = InventoryItem::withTrashed()->whereKey($reorder->itemId)->lockForUpdate()->firstOrFail();
                $previousQuantity = (int) $item->quantity;

                if (!$item->warehouseId) {
                    throw ValidationException::withMessages([
                        'itemId' => 'Assign this item to a warehouse before receiving reorder stock.',
                    ]);
                }

                $item->quantity += $reorder->quantity;
                $item->lastRestocked = now();
                $item->save();
                $transaction = StockTransaction::create([
                    'itemId' => $item->id,
                    'userId' => $request->attributes->get('authenticatedUser')->id,
                    'warehouseId' => $item->warehouseId,
                    'transactionType' => 'stock_in',
                    'quantity' => $reorder->quantity,
                    'supplierId' => $reorder->supplierId,
                    'referenceNumber' => $this->references->generate('stock_in', now()),
                    'processedBy' => $request->attributes->get('authenticatedUser')?->name.' (#'.$request->attributes->get('authenticatedUser')?->id.')',
                    'unitCost' => $item->unitPrice,
                    'notes' => 'Reorder marked received.',
                    'createdAt' => now(),
                ]);
                $this->sync->reconcileItem($item, false);
                $activityLogger->log($request, 'reorder_received', 'inventory_item', $item->id, [
                    'previous' => ['quantity' => $previousQuantity],
                    'updated' => ['quantity' => (int) $item->quantity],
                    'quantityChange' => ['from' => $previousQuantity, 'to' => (int) $item->quantity, 'delta' => (int) $item->quantity - $previousQuantity],
                    'reorderId' => $reorder->id,
                    'stockTransactionId' => $transaction->id,
                    'reason' => 'Reorder received',
                ]);
            }

            $reorder = $reorder->fresh(['item', 'supplier']);
            $this->notifications->reorderUpdated($reorder);

            if ($reorder->item) {
                $this->notifications->stockAlertChanged($reorder->item);
            }

            return $reorder;
        });

        return response()->json($reorder);
    }

    public function destroy(ReorderRequest $reorder)
    {
        if ($reorder->status === 'received') {
            return response()->json(['message' => 'Received reorders cannot be deleted because they have changed inventory quantities.'], 422);
        }

        $reorder->delete();

        return response()->json(['ok' => true]);
    }
}
