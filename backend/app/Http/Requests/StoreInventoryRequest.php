<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInventoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'sku' => ['required', 'string', 'unique:inventory_items', 'max:100'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category' => ['required', 'string', 'max:100'],
            'quantity' => ['required', 'integer', 'min:0'],
            'reorderPoint' => ['required', 'integer', 'min:0'],
            'warehouseId' => ['required', 'exists:warehouses,id'],
            'unitPrice' => ['required', 'numeric', 'min:0'],
        ];
    }
}
