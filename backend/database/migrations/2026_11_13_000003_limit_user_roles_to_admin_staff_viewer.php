<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')->where('role', 'manager')->update(['role' => 'staff']);
        DB::table('users')->where('role', 'viewer')->update(['permission' => 'view']);
    }

    public function down(): void
    {
        // Manager accounts are normalized to staff; their original role cannot
        // be restored safely because existing staff accounts are indistinguishable.
    }
};
