<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            if (!Schema::hasColumn('inventory_items', 'zone')) {
                $table->string('zone')->nullable()->after('storageLocation');
            }
            if (!Schema::hasColumn('inventory_items', 'rack')) {
                $table->string('rack')->nullable()->after('zone');
            }
            if (!Schema::hasColumn('inventory_items', 'shelf')) {
                $table->string('shelf')->nullable()->after('rack');
            }
            if (!Schema::hasColumn('inventory_items', 'assignedAt')) {
                $table->dateTime('assignedAt')->nullable()->after('shelf');
            }
        });
    }

    public function down(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            if (Schema::hasColumn('inventory_items', 'assignedAt')) {
                $table->dropColumn('assignedAt');
            }
            if (Schema::hasColumn('inventory_items', 'shelf')) {
                $table->dropColumn('shelf');
            }
            if (Schema::hasColumn('inventory_items', 'rack')) {
                $table->dropColumn('rack');
            }
            if (Schema::hasColumn('inventory_items', 'zone')) {
                $table->dropColumn('zone');
            }
        });
    }
};
