<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            if (!Schema::hasColumn('inventory_items', 'unit')) {
                $table->string('unit')->default('pcs')->after('category');
            }

            if (!Schema::hasColumn('inventory_items', 'storageLocation')) {
                $table->string('storageLocation')->nullable()->after('warehouseId');
            }
        });
    }

    public function down(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            if (Schema::hasColumn('inventory_items', 'storageLocation')) {
                $table->dropColumn('storageLocation');
            }

            if (Schema::hasColumn('inventory_items', 'unit')) {
                $table->dropColumn('unit');
            }
        });
    }
};