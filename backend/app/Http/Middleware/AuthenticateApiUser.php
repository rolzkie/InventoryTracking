<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Models\ActivityLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateApiUser
{
    public function handle(Request $request, Closure $next): Response
    {
        if (app()->environment('production') && ! $request->isSecure()) {
            return response()->json(['message' => 'HTTPS is required.'], 400);
        }

        if ($request->is('api/auth/csrf-token') || $request->is('api/auth/login') || $request->is('api/auth/forgot-password')) {
            return $next($request);
        }

        $token = $request->bearerToken() ?: $request->cookie('inventory_auth');
        $user = $token ? User::where('api_token', hash('sha256', $token))->first() : null;

        if (! $user || ! $user->active || ! $user->token_expires_at || $user->token_expires_at->isPast()) {
            return response()->json(['message' => 'Authentication is required.'], 401);
        }

        $path = $request->path();
        if ($user->role === 'viewer' || $user->permission === 'view') {
            $viewerReadPrefixes = [
                'api/dashboard',
                'api/inventory',
                'api/warehouses',
                'api/categories',
                'api/suppliers',
                'api/reports',
            ];
            $allowedViewerRead = in_array($request->method(), ['GET', 'HEAD'], true)
                && collect($viewerReadPrefixes)->contains(fn (string $prefix) => $path === $prefix || str_starts_with($path, $prefix.'/'));

            if (! $allowedViewerRead) {
                return response()->json(['message' => 'Viewers can only access inventory information and reports.'], 403);
            }
        }

        if ($user->role !== 'admin' && ($path === 'api/settings' || str_starts_with($path, 'api/settings/'))) {
            return response()->json(['message' => 'Only administrators can access system settings.'], 403);
        }

        if ($user->role !== 'admin' && (str_starts_with($path, 'api/transfers') || str_starts_with($path, 'api/system/'))) {
            return response()->json(['message' => 'Only administrators can access transfer and system administration data.'], 403);
        }

        if ($user->role === 'staff' && str_starts_with($path, 'api/reports/')) {
            return response()->json(['message' => 'Reports are available to administrators and viewers.'], 403);
        }

        if (! in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true)
            && ($user->role === 'viewer' || $user->permission === 'view')) {
            return response()->json(['message' => 'Your account has read-only access.'], 403);
        }

        if (! in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true)) {
            $expectedCsrf = hash_hmac('sha256', $token, (string) config('app.key'));
            if (! hash_equals($expectedCsrf, (string) $request->header('X-CSRF-TOKEN'))) {
                return response()->json(['message' => 'A valid CSRF token is required.'], 419);
            }
        }

        $request->attributes->set('authenticatedUser', $user);

        $response = $next($request);

        $path = $request->path();
        if (! $request->attributes->get('detailedInventoryActivityLogged') && $response->getStatusCode() < 400 && (
            ! in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true)
            || str_starts_with($path, 'api/reports/')
        )) {
            ActivityLog::create([
                'userId' => $user->id,
                'action' => $request->method().' '.$path,
                'subjectType' => 'api_request',
                'subjectId' => null,
                'details' => ['status' => $response->getStatusCode()],
                'ipAddress' => $request->ip(),
            ]);
        }

        return $response;
    }
}
