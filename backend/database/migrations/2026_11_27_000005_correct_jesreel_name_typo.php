<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')
            ->where('email', 'jes@gmail.com')
            ->where('name', 'Jesreel Domaanis')
            ->update(['name' => 'Jesreel Domanais']);
    }

    public function down(): void
    {
        DB::table('users')
            ->where('email', 'jes@gmail.com')
            ->where('name', 'Jesreel Domanais')
            ->update(['name' => 'Jesreel Domaanis']);
    }
};
