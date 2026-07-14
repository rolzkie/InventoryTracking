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
        'unit',
        'quantity',
        'reorderPoint',
        'warehouseId',
        'storageLocation',
        'zone',
        'rack',
        'shelf',
        'assignedAt',
        'unitPrice',
        'lastRestocked',
        'expiryDate',
        'status',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'reorderPoint' => 'integer',
        'warehouseId' => 'integer',
        'unitPrice' => 'decimal:2',
        'lastRestocked' => 'date',
        'expiryDate' => 'date',
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
            // Preserve expiry-based status as "Expiring" when within the next 7 days (and not expired).
            $now = now()->startOfDay();
            $threshold = $now->copy()->addDays(7);
            $isExpiring = false;

            if (!empty($model->expiryDate)) {
                $expiryDay = \Illuminate\Support\Carbon::parse($model->expiryDate)->startOfDay();
                $isExpiring = $expiryDay >= $now && $expiryDay <= $threshold;
            }

            if (!$model->warehouseId) {
                $model->status = 'unassigned';
                return;
            }

            if ($model->quantity === 0) {
                $model->status = 'out_of_stock';
            } elseif ($isExpiring) {
                $model->status = 'Expiring';
            } elseif ($model->quantity < $model->reorderPoint) {
                $model->status = 'low_stock';
            } else {
                $model->status = 'in_stock';
            }
        });
    }
}
