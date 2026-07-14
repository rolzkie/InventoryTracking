<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transfer extends Model
{
    protected $fillable = [
        'sourceWarehouse',
        'destinationWarehouse',
        'itemId',
        'itemName',
        'quantity',
        'status',
        'createdAt',
        'completedAt',
        'notes',
        'fromZone',
        'fromRack',
        'fromShelf',
        'toZone',
        'toRack',
        'toShelf',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'createdAt' => 'datetime',
        'completedAt' => 'datetime',
    ];

    public function item()
    {
        return $this->belongsTo(InventoryItem::class, 'itemId');
    }

    public function sourceWh()
    {
        return $this->belongsTo(Warehouse::class, 'sourceWarehouse');
    }

    public function destinationWh()
    {
        return $this->belongsTo(Warehouse::class, 'destinationWarehouse');
    }
}
