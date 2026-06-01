<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://10.10.72.180:5173',
        'https://10.10.72.180:5173',
        env('FRONTEND_URL'),
    ],

    'allowed_origins_patterns' => ['/^https?:\/\/10\.\d+\.\d+\.\d+:\d+$/', '/^https?:\/\/.*\.vercel\.app$/', '/^http:\/\/localhost:\d+$/', '/^http:\/\/127\.0\.0\.1:\d+$/'],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];