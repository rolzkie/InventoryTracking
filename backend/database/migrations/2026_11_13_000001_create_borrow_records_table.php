<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('borrow_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('itemId')->constrained('inventory_items')->restrictOnDelete();
            $table->foreignId('borrowedBy')->nullable()->constrained('users')->nullOnDelete();
            $table->string('borrowerName', 255);
            $table->unsignedInteger('quantity');
            $table->unsignedInteger('quantityReturned')->default(0);
            $table->date('borrowedAt');
            $table->date('expectedReturnAt');
            $table->dateTime('returnedAt')->nullable();
            $table->string('status')->default('borrowed')->index();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['itemId', 'status']);
            $table->index(['status', 'expectedReturnAt']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('borrow_records');
    }
};
