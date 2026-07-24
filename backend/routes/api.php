<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\WarehouseController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\TransferController;
use App\Http\Controllers\StockTransactionController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ReferenceDataController;
use App\Http\Controllers\ReorderRequestController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\AlertAcknowledgementController;
use App\Http\Controllers\SystemDataController;

Route::middleware('api')->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);

    Route::apiResource('users', UserController::class)->middleware('account.manager');
    Route::get('/categories', [ReferenceDataController::class, 'categories']);
    Route::get('/suppliers', [ReferenceDataController::class, 'suppliers']);
    Route::apiResource('reorders', ReorderRequestController::class)->except(['show']);
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::get('/settings', [SettingController::class, 'index']);
    Route::put('/settings/{section}', [SettingController::class, 'update']);
    Route::get('/alert-acknowledgements', [AlertAcknowledgementController::class, 'index']);
    Route::post('/alert-acknowledgements', [AlertAcknowledgementController::class, 'store']);
    Route::get('/system/export', [SystemDataController::class, 'export']);
    Route::post('/system/reset', [SystemDataController::class, 'reset']);

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
    Route::get('/reports/stock-movement', [ReportController::class, 'stockMovement']);
    Route::get('/reports/category-distribution', [ReportController::class, 'categoryDistribution']);
    Route::get('/reports/low-stock', [ReportController::class, 'lowStock']);
});
