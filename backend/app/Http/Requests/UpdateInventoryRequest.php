<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateInventoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'sku' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
            ],
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category' => ['sometimes', 'string', 'max:100'],
            'quantity' => ['sometimes', 'integer', 'min:0'],
            'reorderPoint' => ['sometimes', 'integer', 'min:0'],
            'warehouseId' => ['sometimes', 'exists:warehouses,id'],
            'unitPrice' => ['sometimes', 'numeric', 'min:0'],
        ];
    }
}
