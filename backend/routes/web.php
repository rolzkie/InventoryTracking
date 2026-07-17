<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\WarehouseController;
use App\Http\Controllers\TransferController;

Route::get('/', function () {
    return view('app');
});

Route::get('/dashboard', [DashboardController::class, 'page']);
Route::get('/inventory', [InventoryController::class, 'page']);
Route::get('/warehouses', [WarehouseController::class, 'page']);
Route::get('/transfers', [TransferController::class, 'page']);
Route::get('/transactions', [\App\Http\Controllers\StockTransactionController::class, 'page']);


Route::get('/assets/{file}', function (string $file) {
    $path = realpath(base_path('../dist/assets/' . $file));
    $assetsDir = realpath(base_path('../dist/assets'));

    if ($path === false || $assetsDir === false || ! str_starts_with($path, $assetsDir)) {
        abort(404);
    }

    $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
    $mimeType = match ($extension) {
        'css' => 'text/css; charset=UTF-8',
        'js' => 'text/javascript; charset=UTF-8',
        'json' => 'application/json; charset=UTF-8',
        'svg' => 'image/svg+xml',
        'png' => 'image/png',
        'jpg', 'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'ico' => 'image/x-icon',
        'woff' => 'font/woff',
        'woff2' => 'font/woff2',
        default => mime_content_type($path) ?: 'application/octet-stream',
    };

    $contents = file_get_contents($path);

    return response($contents, 200, ['Content-Type' => $mimeType]);
});

Route::fallback(function () {
    return view('app');
});

Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});
