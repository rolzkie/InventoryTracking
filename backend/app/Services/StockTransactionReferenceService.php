<?php

namespace App\Services;

use App\Models\StockTransaction;
use Carbon\CarbonInterface;

class StockTransactionReferenceService
{
    public function generate(string $transactionType, ?CarbonInterface $date = null): string
    {
        $prefix = $transactionType === 'stock_out' ? 'STKOUT' : 'STKIN';
        $day = ($date ?? now())->format('Ymd');
        $base = "{$prefix}-{$day}-";

        $latest = StockTransaction::query()
            ->where('referenceNumber', 'like', $base.'%')
            ->orderByDesc('referenceNumber')
            ->value('referenceNumber');

        $next = 1;
        if (is_string($latest) && preg_match('/-(\d{4})$/', $latest, $matches)) {
            $next = ((int) $matches[1]) + 1;
        }

        return sprintf('%s%04d', $base, $next);
    }
}
