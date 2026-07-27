<?php

namespace App\Services;

use App\Models\AppNotification;
use App\Models\InventoryItem;
use App\Models\ReorderRequest;
use App\Models\StockTransaction;
use App\Models\Transfer;

class InventoryNotificationService
{
    public function stockAlertChanged(InventoryItem $item): void
    {
        $item->refresh();

        if (!$item->warehouseId || !in_array($item->status, ['out_of_stock', 'low_stock', 'overstock'], true)) {
            $this->markStockAlertsRead($item);
            return;
        }

        if ($item->status === 'out_of_stock') {
            $this->createOnce(
                'Out of Stock',
                "{$item->name} is out of stock.",
                'error',
            );
            return;
        }

        if ($item->status === 'overstock') {
            $this->createOnce(
                'Overstock',
                "{$item->name} exceeds its maximum stock ({$item->quantity}/{$item->maxStock}).",
                'info',
            );
            return;
        }

        $this->createOnce(
            'Low Stock',
            "{$item->name} is below its reorder point ({$item->quantity}/{$item->reorderPoint}).",
            'warning',
        );
    }

    public function inventoryAssigned(InventoryItem $item): void
    {
        $warehouseName = $item->warehouse?->name ?? 'a warehouse';
        $this->create(
            'Inventory Updated',
            "{$item->name} was assigned to {$warehouseName}.",
            'info',
        );

        $this->stockAlertChanged($item);
    }

    public function stockTransactionCreated(StockTransaction $transaction): void
    {
        $transaction->loadMissing(['item', 'warehouse']);
        $itemName = $transaction->item?->name ?? 'Inventory item';
        $warehouseName = $transaction->warehouse?->name ?? 'warehouse';
        $isStockIn = $transaction->transactionType === 'stock_in';

        $this->create(
            $isStockIn ? 'Stock In' : 'Stock Out',
            sprintf(
                '%s%d units of %s %s %s.',
                $isStockIn ? '+' : '-',
                $transaction->quantity,
                $itemName,
                $isStockIn ? 'received into' : 'released from',
                $warehouseName,
            ),
            $isStockIn ? 'success' : 'warning',
        );

        if ($transaction->item) {
            $this->stockAlertChanged($transaction->item);
        }
    }

    public function reorderCreated(ReorderRequest $reorder): void
    {
        $reorder->loadMissing(['item', 'supplier']);
        $itemName = $reorder->item?->name ?? 'Inventory item';
        $supplierName = $reorder->supplier?->name;

        $this->create(
            'Reorder Request',
            "Reorder request created for {$reorder->quantity} units of {$itemName}" . ($supplierName ? " from {$supplierName}." : '.'),
            'info',
        );

        if ($reorder->item) {
            $this->stockAlertChanged($reorder->item);
        }
    }

    public function reorderUpdated(ReorderRequest $reorder): void
    {
        $reorder->loadMissing('item');
        $itemName = $reorder->item?->name ?? 'Inventory item';

        $this->create(
            'Reorder Updated',
            "Reorder for {$itemName} was marked {$reorder->status}.",
            $reorder->status === 'received' ? 'success' : 'info',
        );
    }

    public function transferCompleted(Transfer $transfer): void
    {
        $transfer->loadMissing(['item', 'sourceWh', 'destinationWh']);
        $itemName = $transfer->item?->name ?? $transfer->itemName;
        $from = $transfer->sourceWh?->name ?? 'source warehouse';
        $to = $transfer->destinationWh?->name ?? 'destination warehouse';

        $this->create(
            'Transfer Completed',
            "{$transfer->quantity} units of {$itemName} moved from {$from} to {$to}.",
            'success',
        );

        if ($transfer->item) {
            $this->stockAlertChanged($transfer->item);
        }
    }

    public function inventoryUpdated(InventoryItem $item): void
    {
        $this->create(
            'Inventory Updated',
            "{$item->name} inventory details were updated.",
            'info',
        );

        $this->stockAlertChanged($item);
    }

    protected function markStockAlertsRead(InventoryItem $item): void
    {
        AppNotification::where('read', false)
            ->whereIn('title', ['Low Stock', 'Out of Stock', 'Overstock'])
            ->where('message', 'like', "%{$item->name}%")
            ->update(['read' => true]);
    }

    protected function createOnce(string $title, string $message, string $type): void
    {
        AppNotification::firstOrCreate(
            ['title' => $title, 'message' => $message, 'read' => false],
            ['type' => $type],
        );
    }

    protected function create(string $title, string $message, string $type): void
    {
        AppNotification::create([
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'read' => false,
        ]);
    }
}
