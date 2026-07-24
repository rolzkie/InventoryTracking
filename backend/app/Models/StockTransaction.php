<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockTransaction extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'itemId',
        'warehouseId',
        'transactionType',
        'quantity',
        'expirationDate',
        'supplierId',
        'purpose',
        'referenceNumber',
        'processedBy',
        'unitCost',
        'notes',
        'createdAt',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unitCost' => 'decimal:2',
        'expirationDate' => 'date',
        'createdAt' => 'datetime',
    ];

    public function item()
    {
        return $this->belongsTo(InventoryItem::class, 'itemId');
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class, 'warehouseId');
    }
}
