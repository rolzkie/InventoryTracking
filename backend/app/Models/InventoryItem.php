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
        'maxStock',
        'warehouseId',
        'storageLocation',
        'zone',
        'rack',
        'shelf',
        'assignedAt',
        'unitPrice',
        'supplierId',
        'lastRestocked',
        'expiryDate',
        'status',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'reorderPoint' => 'integer',
        'maxStock' => 'integer',
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

    public function computeStockStatus(): string
    {
        if (!$this->warehouseId) {
            return 'unassigned';
        }

        if ((int) $this->quantity <= 0) {
            return 'out_of_stock';
        }

        if ((int) $this->maxStock > 0 && (int) $this->quantity > (int) $this->maxStock) {
            return 'overstock';
        }

        if ((int) $this->quantity <= (int) $this->reorderPoint) {
            return 'low_stock';
        }

        if (!empty($this->expiryDate)) {
            $expiryDay = \Illuminate\Support\Carbon::parse($this->expiryDate)->startOfDay();

            if ($expiryDay < now()->startOfDay()) {
                return 'expired';
            }
        }

        return 'in_stock';
    }

    public function refreshStockStatus(): bool
    {
        $this->status = $this->computeStockStatus();

        return $this->save();
    }

    protected static function booted()
    {
        static::saving(function ($model) {
            $model->status = $model->computeStockStatus();
        });
    }
}
