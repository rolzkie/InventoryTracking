<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BorrowRecord extends Model
{
    protected $fillable = [
        'itemId', 'borrowedBy', 'borrowerName', 'quantity', 'quantityReturned',
        'borrowedAt', 'expectedReturnAt', 'returnedAt', 'status', 'notes',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'quantityReturned' => 'integer',
        'borrowedAt' => 'date:Y-m-d',
        'expectedReturnAt' => 'date:Y-m-d',
        'returnedAt' => 'datetime',
    ];

    protected $appends = ['outstandingQuantity'];

    public function item()
    {
        return $this->belongsTo(InventoryItem::class, 'itemId');
    }

    public function getOutstandingQuantityAttribute(): int
    {
        return max(0, $this->quantity - $this->quantityReturned);
    }
}
