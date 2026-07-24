<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Supplier;

class ReferenceDataController extends Controller
{
    public function categories()
    {
        return response()->json(Category::orderBy('name')->get());
    }

    public function suppliers()
    {
        return response()->json(Supplier::orderBy('name')->get());
    }
}
