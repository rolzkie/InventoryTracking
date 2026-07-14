<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\WarehouseController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\TransferController;
use App\Http\Controllers\StockTransactionController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ReportController;

Route::middleware('api')->group(function () {
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Warehouses
    Route::apiResource('warehouses', WarehouseController::class);

    // Inventory
    Route::apiResource('inventory', InventoryController::class);
    Route::post('/inventory/{id}/adjust', [InventoryController::class, 'adjust']);
    Route::post('/inventory/{inventory}/assign', [InventoryController::class, 'assign']);

    // Transfers
    Route::apiResource('transfers', TransferController::class);

    // Stock transactions
    Route::apiResource('transactions', StockTransactionController::class);

    // Reports
    Route::get('/reports/summary', [ReportController::class, 'summary']);
    Route::get('/reports/low-stock', [ReportController::class, 'lowStock']);
});
