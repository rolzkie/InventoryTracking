<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryItem extends Model
{
    protected $table = 'inventory_items';

    protected $fillable = [
        'sku',
        'name',
        'description',
        'category',
        'quantity',
        'reorderPoint',
        'warehouseId',
        'unitPrice',
        'lastRestocked',
        'status',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'reorderPoint' => 'integer',
        'unitPrice' => 'decimal:2',
        'lastRestocked' => 'date',
    ];

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class, 'warehouseId');
    }

    public function transfers()
    {
        return $this->hasMany(Transfer::class, 'itemId');
    }

    protected static function booted()
    {
        static::saving(function ($model) {
            if ($model->quantity === 0) {
                $model->status = 'out_of_stock';
            } elseif ($model->quantity < $model->reorderPoint) {
                $model->status = 'low_stock';
            } else {
                $model->status = 'in_stock';
            }
        });
    }
}
