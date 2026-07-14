<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_transactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('itemId');
            $table->unsignedBigInteger('warehouseId');
            $table->string('transactionType');
            $table->integer('quantity');
            $table->date('expirationDate')->nullable();
            $table->text('notes')->nullable();
            $table->dateTime('createdAt')->nullable();
            $table->timestamps();

            $table->foreign('itemId')->references('id')->on('inventory_items')->onDelete('cascade');
            $table->foreign('warehouseId')->references('id')->on('warehouses')->onDelete('restrict');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_transactions');
    }
};
