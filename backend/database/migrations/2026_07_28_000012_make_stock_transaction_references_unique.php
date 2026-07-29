<?php

use App\Models\StockTransaction;
use App\Services\StockTransactionReferenceService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $generator = app(StockTransactionReferenceService::class);

        DB::transaction(function () use ($generator) {
            $transactions = StockTransaction::query()
                ->orderBy('createdAt')
                ->orderBy('id')
                ->lockForUpdate()
                ->get();

            $usedReferences = [];

            foreach ($transactions as $transaction) {
                $reference = $transaction->referenceNumber;

                if (!is_string($reference) || $reference === '') {
                    $reference = $generator->generate((string) $transaction->transactionType, $transaction->createdAt);
                }

                if (isset($usedReferences[$reference])) {
                    $base = preg_replace('/-\d{4}$/', '-', $reference) ?? '';
                    $sequence = 1;
                    if (preg_match('/-(\d{4})$/', $reference, $matches)) {
                        $sequence = (int) $matches[1];
                    }

                    do {
                        $sequence++;
                        $reference = sprintf('%s%04d', $base, $sequence);
                    } while (isset($usedReferences[$reference]));

                    $transaction->referenceNumber = $reference;
                    $transaction->save();
                }

                $usedReferences[$reference] = true;
            }
        });

        Schema::table('stock_transactions', function (Blueprint $table) {
            $table->unique('referenceNumber');
        });
    }

    public function down(): void
    {
        Schema::table('stock_transactions', function (Blueprint $table) {
            $table->dropUnique(['referenceNumber']);
        });
    }
};
