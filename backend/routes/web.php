<?php

use Illuminate\Support\Facades\Route;

Route::get('/assets/{file}', function (string $file) {
    $assetPath = base_path('../dist/assets/' . $file);

    if (file_exists($assetPath)) {
        return response()->file($assetPath);
    }

    abort(404);
})->where('file', '.*');

Route::get('/{any?}', function (?string $any = null) {
    $indexPath = base_path('../dist/index.html');

    if (file_exists($indexPath)) {
        return response()->file($indexPath, ['Content-Type' => 'text/html; charset=UTF-8']);
    }

    return view('welcome');
})->where('any', '^(?!api)(?!assets).*$');

Route::resource('inventory', App\Http\Controllers\InventoryController::class);
