<?php

namespace App\Http\Controllers;

use App\Models\BorrowRecord;
use App\Models\InventoryItem;
use App\Models\StockTransaction;
use App\Services\StockTransactionReferenceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BorrowRecordController extends Controller
{
    public function index()
    {
        return response()->json(BorrowRecord::with('item')->latest()->get()->map(function (BorrowRecord $record) {
            $data = $record->toArray();
            $data['status'] = $record->status === 'borrowed' && $record->expectedReturnAt->isPast() ? 'overdue' : $record->status;
            return $data;
        }));
    }

    public function store(Request $request, StockTransactionReferenceService $references)
    {
        $validated = $request->validate([
            'itemId' => ['required', 'integer', 'exists:inventory_items,id'],
            'borrowerName' => ['required', 'string', 'max:255'],
            'quantity' => ['required', 'integer', 'min:1'],
            'borrowedAt' => ['required', 'date'],
            'expectedReturnAt' => ['required', 'date', 'after_or_equal:borrowedAt'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $record = DB::transaction(function () use ($validated, $request, $references) {
            $item = InventoryItem::query()->lockForUpdate()->findOrFail($validated['itemId']);
            if ($item->quantity < $validated['quantity']) {
                throw ValidationException::withMessages(['quantity' => 'Borrow quantity exceeds available stock.']);
            }
            if (! $item->warehouseId) {
                throw ValidationException::withMessages(['itemId' => 'Assign the item to a storage location before borrowing.']);
            }

            $item->quantity -= $validated['quantity'];
            $item->save();

            $record = BorrowRecord::create([
                ...$validated,
                'borrowedBy' => $request->attributes->get('authenticatedUser')?->id,
                'status' => 'borrowed',
            ]);
            StockTransaction::create([
                'itemId' => $item->id,
                'warehouseId' => $item->warehouseId,
                'transactionType' => 'stock_out',
                'quantity' => $validated['quantity'],
                'purpose' => 'borrow',
                'processedBy' => $request->attributes->get('authenticatedUser')?->name,
                'notes' => 'Borrow record #'.$record->id.': '.$validated['borrowerName'],
                'createdAt' => now(),
                'referenceNumber' => $references->generate('stock_out'),
            ]);

            return $record;
        });

        return response()->json($record->load('item'), 201);
    }

    public function returnItems(Request $request, BorrowRecord $borrow, StockTransactionReferenceService $references)
    {
        $validated = $request->validate(['quantity' => ['required', 'integer', 'min:1']]);

        $record = DB::transaction(function () use ($borrow, $validated, $request, $references) {
            $record = BorrowRecord::query()->lockForUpdate()->findOrFail($borrow->id);
            $outstanding = $record->quantity - $record->quantityReturned;
            if ($validated['quantity'] > $outstanding) {
                throw ValidationException::withMessages(['quantity' => 'Return quantity exceeds the outstanding borrowed quantity.']);
            }

            $item = InventoryItem::query()->lockForUpdate()->findOrFail($record->itemId);
            $item->quantity += $validated['quantity'];
            $item->save();

            $record->quantityReturned += $validated['quantity'];
            if ($record->quantityReturned === $record->quantity) {
                $record->status = 'returned';
                $record->returnedAt = now();
            }
            $record->save();

            StockTransaction::create([
                'itemId' => $item->id,
                'warehouseId' => $item->warehouseId,
                'transactionType' => 'stock_in',
                'quantity' => $validated['quantity'],
                'purpose' => 'return',
                'processedBy' => $request->attributes->get('authenticatedUser')?->name,
                'notes' => 'Return for borrow record #'.$record->id,
                'createdAt' => now(),
                'referenceNumber' => $references->generate('stock_in'),
            ]);

            return $record;
        });

        return response()->json($record->load('item'));
    }
}
