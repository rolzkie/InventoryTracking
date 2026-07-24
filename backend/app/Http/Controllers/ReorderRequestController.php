<?php

namespace App\Http\Controllers;

use App\Models\ReorderRequest;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ReorderRequestController extends Controller
{
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

        $hasOpenRequest = ReorderRequest::where('itemId', $validated['itemId'])
            ->whereIn('status', ['pending', 'approved', 'ordered'])
            ->exists();

        if ($hasOpenRequest) {
            return response()->json(['message' => 'An open reorder already exists for this item.'], 422);
        }

        return response()->json(ReorderRequest::create($validated), 201);
    }

    public function update(Request $request, ReorderRequest $reorder)
    {
        $validated = $request->validate([
            'quantity' => ['sometimes', 'integer', 'min:1'],
            'status' => ['sometimes', Rule::in(['pending', 'approved', 'ordered', 'received'])],
            'estimatedDelivery' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        $reorder->update($validated);

        return response()->json($reorder->fresh(['item', 'supplier']));
    }

    public function destroy(ReorderRequest $reorder)
    {
        $reorder->delete();

        return response()->json(['ok' => true]);
    }
}
