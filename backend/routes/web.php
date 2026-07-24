<?php

use Illuminate\Support\Facades\Route;

$serveReactApp = function () {
    $indexPath = base_path('../dist/index.html');

    abort_unless(
        is_file($indexPath),
        503,
        'React build not found. Run "npm run build" from the workspace root.',
    );

    return response()->file($indexPath, ['Content-Type' => 'text/html; charset=UTF-8']);
};

Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});

Route::get('/assets/{file}', function (string $file) {
    $assetsDir = realpath(base_path('../dist/assets'));
    $path = realpath(base_path('../dist/assets/'.$file));

    if ($path === false || $assetsDir === false || ! str_starts_with($path, $assetsDir.DIRECTORY_SEPARATOR)) {
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

    return response()->file($path, ['Content-Type' => $mimeType]);
})->where('file', '.*');

Route::get('/', $serveReactApp);
Route::fallback($serveReactApp);
