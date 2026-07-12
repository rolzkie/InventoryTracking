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

    protected $appends = ['status', 'capacityUsed'];

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

    public function computeStatus(): string
    {
        $used = (int) $this->inventoryItems()->sum('quantity');
        $capacity = (int) $this->capacity;

        if ($capacity <= 0) {
            return 'active';
        }

        $ratio = $used / $capacity;

        if ($ratio >= 0.9) {
            return 'near_full';
        }

        if ($ratio >= 0.7) {
            return 'active';
        }

        return 'active';
    }

    public function getStatusAttribute(): string
    {
        return $this->computeStatus();
    }

    public function getCapacityUsedAttribute(): int
    {
        return (int) $this->inventoryItems()->sum('quantity');
    }
}
