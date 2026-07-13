<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\UpdateLastSeen;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->prepend(\App\Http\Middleware\TokenFromQuery::class);
        $middleware->alias([
            'update.last.seen' => UpdateLastSeen::class,
            'token.query' => \App\Http\Middleware\TokenFromQuery::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, \Illuminate\Http\Request $request) {
            if ($request->is('api/*/download')) {
                $urlWithoutToken = preg_replace('/([?&])token=[^&]+(&|$)/', '$1', $request->fullUrl());
                $urlWithoutToken = rtrim($urlWithoutToken, '?&');
                $urlPathOnly = str_replace(url('/'), '', $urlWithoutToken);
                
                return redirect(env('FRONTEND_URL', 'http://localhost:5173') . '/preview?url=' . urlencode($urlPathOnly));
            }
        });
    })->create();