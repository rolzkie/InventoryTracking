<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ReferenceDataController extends Controller
{
    public function categories()
    {
        return response()->json(Category::orderBy('name')->get());
    }

    public function storeCategory(Request $request)
    {
        abort_unless($request->attributes->get('authenticatedUser')?->role === 'admin', 403);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100', 'unique:categories,name'],
            'color' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ]);
        return response()->json(Category::create($data), 201);
    }

    public function updateCategory(Request $request, Category $category)
    {
        abort_unless($request->attributes->get('authenticatedUser')?->role === 'admin', 403);
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:100', Rule::unique('categories', 'name')->ignore($category->id)],
            'color' => ['sometimes', 'required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ]);
        $category->update($data);
        return response()->json($category);
    }

    public function deleteCategory(Request $request, Category $category)
    {
        abort_unless($request->attributes->get('authenticatedUser')?->role === 'admin', 403);
        if (\App\Models\InventoryItem::where('category', $category->name)->exists()) {
            return response()->json(['message' => 'This category is assigned to inventory items.'], 422);
        }
        $category->delete();
        return response()->json(['ok' => true]);
    }

    public function suppliers()
    {
        return response()->json(Supplier::orderBy('name')->get());
    }
}
