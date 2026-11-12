<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('staff');
            $table->string('permission')->default('manage');
            $table->string('avatar', 10)->nullable();
            $table->string('department')->nullable();
            $table->dateTime('last_login')->nullable();
            $table->boolean('active')->default(true);
        });

        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('color', 20)->default('#3B82F6');
            $table->timestamps();
        });

        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('contact')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->timestamps();
        });

        Schema::create('reorder_requests', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('itemId');
            $table->unsignedBigInteger('supplierId')->nullable();
            $table->integer('quantity');
            $table->string('status')->default('pending');
            $table->date('estimatedDelivery')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('itemId')->references('id')->on('inventory_items')->cascadeOnDelete();
            $table->foreign('supplierId')->references('id')->on('suppliers')->nullOnDelete();
        });

        Schema::create('app_notifications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('userId')->nullable();
            $table->string('title');
            $table->text('message');
            $table->string('type')->default('info');
            $table->boolean('read')->default(false);
            $table->timestamps();

            $table->foreign('userId')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::create('alert_acknowledgements', function (Blueprint $table) {
            $table->id();
            $table->string('alertId')->unique();
            $table->unsignedBigInteger('userId')->nullable();
            $table->timestamp('acknowledgedAt');

            $table->foreign('userId')->references('id')->on('users')->nullOnDelete();
        });

        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('section')->unique();
            $table->json('payload');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_settings');
        Schema::dropIfExists('alert_acknowledgements');
        Schema::dropIfExists('app_notifications');
        Schema::dropIfExists('reorder_requests');
        Schema::dropIfExists('suppliers');
        Schema::dropIfExists('categories');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'permission', 'avatar', 'department', 'last_login', 'active']);
        });
    }
};
