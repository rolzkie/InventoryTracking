<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'message' => 'Laravel API is running. Use Vite at http://localhost:5173.',
        'status' => 'ok',
    ]);
});

Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});
