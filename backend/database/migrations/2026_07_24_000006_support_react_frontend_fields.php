<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('warehouses', function (Blueprint $table) {
            $table->string('address')->nullable();
            $table->json('zones')->nullable();
        });

        Schema::table('inventory_items', function (Blueprint $table) {
            $table->integer('maxStock')->default(0);
            $table->string('supplierId')->nullable();
        });

        Schema::table('stock_transactions', function (Blueprint $table) {
            $table->string('supplierId')->nullable();
            $table->string('purpose')->nullable();
            $table->string('referenceNumber')->nullable();
            $table->string('processedBy')->nullable();
            $table->decimal('unitCost', 10, 2)->default(0);
        });

        Schema::table('transfers', function (Blueprint $table) {
            $table->string('requestedBy')->nullable();
            $table->string('approvedBy')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('transfers', function (Blueprint $table) {
            $table->dropColumn(['requestedBy', 'approvedBy']);
        });
        Schema::table('stock_transactions', function (Blueprint $table) {
            $table->dropColumn(['supplierId', 'purpose', 'referenceNumber', 'processedBy', 'unitCost']);
        });
        Schema::table('inventory_items', function (Blueprint $table) {
            $table->dropColumn(['maxStock', 'supplierId']);
        });
        Schema::table('warehouses', function (Blueprint $table) {
            $table->dropColumn(['address', 'zones']);
        });
    }
};
