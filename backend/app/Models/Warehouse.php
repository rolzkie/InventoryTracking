<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Warehouse extends Model
{
    protected $fillable = [
        'name',
        'location',
        'capacity',
        'used',
        'manager',
    ];

    public function inventoryItems()
    {
        return $this->hasMany(InventoryItem::class, 'warehouseId');
    }

    public function outgoingTransfers()
    {
        return $this->hasMany(Transfer::class, 'sourceWarehouse');
    }

    public function incomingTransfers()
    {
        return $this->hasMany(Transfer::class, 'destinationWarehouse');
    }
}
