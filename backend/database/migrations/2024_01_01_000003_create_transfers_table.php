<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transfers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('sourceWarehouse');
            $table->unsignedBigInteger('destinationWarehouse');
            $table->unsignedBigInteger('itemId');
            $table->string('itemName');
            $table->integer('quantity');
            $table->string('status')->default('pending');
            $table->text('notes')->nullable();
            $table->dateTime('createdAt')->nullable();
            $table->dateTime('completedAt')->nullable();
            $table->timestamps();

            $table->foreign('sourceWarehouse')->references('id')->on('warehouses')->onDelete('restrict');
            $table->foreign('destinationWarehouse')->references('id')->on('warehouses')->onDelete('restrict');
            $table->foreign('itemId')->references('id')->on('inventory_items')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transfers');
    }
};
