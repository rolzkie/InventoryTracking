<?php

namespace App\Http\Controllers;

use App\Models\Warehouse;
use Illuminate\Http\Request;

class WarehouseController extends Controller
{
    public function index()
    {
        return response()->json(Warehouse::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'capacity' => 'required|integer|min:0',
            'manager' => 'required|string|max:255',
        ]);

        $warehouse = Warehouse::create($validated);
        return response()->json($warehouse, 201);
    }

    public function show(Warehouse $warehouse)
    {
        return response()->json($warehouse);
    }

    public function update(Request $request, Warehouse $warehouse)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'location' => 'sometimes|string|max:255',
            'capacity' => 'sometimes|integer|min:0',
            'used' => 'sometimes|integer|min:0',
            'manager' => 'sometimes|string|max:255',
        ]);

        $warehouse->update($validated);
        return response()->json($warehouse);
    }

    public function destroy(Warehouse $warehouse)
    {
        $warehouse->delete();
        return response()->json(['ok' => true]);
    }
}
