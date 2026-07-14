<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transfers', function (Blueprint $table) {
            if (!Schema::hasColumn('transfers', 'fromZone')) {
                $table->string('fromZone')->nullable()->after('notes');
            }
            if (!Schema::hasColumn('transfers', 'fromRack')) {
                $table->string('fromRack')->nullable()->after('fromZone');
            }
            if (!Schema::hasColumn('transfers', 'fromShelf')) {
                $table->string('fromShelf')->nullable()->after('fromRack');
            }
            if (!Schema::hasColumn('transfers', 'toZone')) {
                $table->string('toZone')->nullable()->after('fromShelf');
            }
            if (!Schema::hasColumn('transfers', 'toRack')) {
                $table->string('toRack')->nullable()->after('toZone');
            }
            if (!Schema::hasColumn('transfers', 'toShelf')) {
                $table->string('toShelf')->nullable()->after('toRack');
            }
        });
    }

    public function down(): void
    {
        Schema::table('transfers', function (Blueprint $table) {
            if (Schema::hasColumn('transfers', 'toShelf')) {
                $table->dropColumn('toShelf');
            }
            if (Schema::hasColumn('transfers', 'toRack')) {
                $table->dropColumn('toRack');
            }
            if (Schema::hasColumn('transfers', 'toZone')) {
                $table->dropColumn('toZone');
            }
            if (Schema::hasColumn('transfers', 'fromShelf')) {
                $table->dropColumn('fromShelf');
            }
            if (Schema::hasColumn('transfers', 'fromRack')) {
                $table->dropColumn('fromRack');
            }
            if (Schema::hasColumn('transfers', 'fromZone')) {
                $table->dropColumn('fromZone');
            }
        });
    }
};
