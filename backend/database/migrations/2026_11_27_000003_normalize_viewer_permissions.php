<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')->whereIn('role', ['viewer', 'visitor'])->update(['permission' => 'view']);
    }

    public function down(): void
    {
        // Viewer accounts must remain view-only; there is no safe prior value
        // to restore for records that incorrectly had manage permission.
    }
};
