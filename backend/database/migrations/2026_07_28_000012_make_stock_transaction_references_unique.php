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

            foreach ($transactions as $transaction) {
                if (!empty($transaction->referenceNumber)) {
                    continue;
                }

                $transaction->referenceNumber = $generator->generate((string) $transaction->transactionType, $transaction->createdAt);
                $transaction->save();
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
