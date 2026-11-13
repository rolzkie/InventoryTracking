<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('userId')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 120)->index();
            $table->string('subjectType', 120)->nullable();
            $table->string('subjectId', 80)->nullable();
            $table->json('details')->nullable();
            $table->string('ipAddress', 45)->nullable();
            $table->timestamp('created_at')->useCurrent()->index();
            $table->index(['subjectType', 'subjectId']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
