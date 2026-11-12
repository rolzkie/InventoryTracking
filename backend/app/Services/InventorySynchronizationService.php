<?php

namespace App\Services;

use App\Models\InventoryItem;

class InventorySynchronizationService
{
    public function __construct(protected InventoryNotificationService $notifications)
    {
    }

    public function reconcileItem(InventoryItem $item, bool $notify = true): InventoryItem
    {
        $item->refresh();
        $item->refreshStockStatus();
        $item = $item->fresh('warehouse');

        if ($notify) {
            $this->notifications->stockAlertChanged($item);
        }

        return $item;
    }

    public function reconcileItemId(int $itemId, bool $notify = true): ?InventoryItem
    {
        $item = InventoryItem::find($itemId);

        return $item ? $this->reconcileItem($item, $notify) : null;
    }
}
