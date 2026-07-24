<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReorderRequest extends Model
{
    protected $fillable = [
        'itemId',
        'supplierId',
        'quantity',
        'status',
        'estimatedDelivery',
        'notes',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'estimatedDelivery' => 'date',
    ];

    public function item()
    {
        return $this->belongsTo(InventoryItem::class, 'itemId');
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'supplierId');
    }
}
