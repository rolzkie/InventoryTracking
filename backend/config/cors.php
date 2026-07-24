<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ],

    // Allow direct API development from private LAN addresses. The normal
    // Vite setup uses its same-origin proxy and does not require CORS.
    'allowed_origins_patterns' => [
        '#^https?://localhost(?::\d+)?$#',
        '#^https?://127\.0\.0\.1(?::\d+)?$#',
        '#^https?://10(?:\.\d{1,3}){3}(?::\d+)?$#',
        '#^https?://192\.168(?:\.\d{1,3}){2}(?::\d+)?$#',
        '#^https?://172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}(?::\d+)?$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,
];
