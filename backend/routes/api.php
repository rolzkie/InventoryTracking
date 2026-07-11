<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\WarehouseController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\TransferController;
use App\Http\Controllers\DashboardController;

Route::middleware('api')->group(function () {
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Warehouses
    Route::apiResource('warehouses', WarehouseController::class);

    // Inventory
    Route::apiResource('inventory', InventoryController::class);
    Route::post('/inventory/{id}/adjust', [InventoryController::class, 'adjust']);

    // Transfers
    Route::apiResource('transfers', TransferController::class);
});
