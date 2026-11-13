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
        if ($request->is('api/auth/csrf-token') || $request->is('api/auth/login') || $request->is('api/auth/forgot-password')) {
            return $next($request);
        }

        $token = $request->bearerToken() ?: $request->cookie('inventory_auth');
        $user = $token ? User::where('api_token', hash('sha256', $token))->first() : null;

        if (! $user || ! $user->active || ! $user->token_expires_at || $user->token_expires_at->isPast()) {
            return response()->json(['message' => 'Authentication is required.'], 401);
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
        if ($response->getStatusCode() < 400 && (
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
