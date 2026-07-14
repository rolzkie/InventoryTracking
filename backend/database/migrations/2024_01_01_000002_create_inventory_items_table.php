<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->string('sku')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('category');
            $table->string('unit')->default('pcs');
            $table->integer('quantity')->default(0);
            $table->integer('reorderPoint')->default(0);
            $table->unsignedBigInteger('warehouseId')->nullable();
            $table->string('storageLocation')->nullable();
            $table->decimal('unitPrice', 10, 2)->default(0);
            $table->date('lastRestocked')->nullable();
            $table->string('status')->default('unassigned');
            $table->timestamps();

            $table->foreign('warehouseId')->references('id')->on('warehouses')->onDelete('restrict');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_items');
    }
};
