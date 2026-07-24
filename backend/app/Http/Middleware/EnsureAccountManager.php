<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAccountManager
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();
        $user = $token
            ? User::where('api_token', hash('sha256', $token))->first()
            : null;

        if (! $user || ! $user->active || ! $user->token_expires_at || $user->token_expires_at->isPast()) {
            return response()->json(['message' => 'Authentication is required.'], 401);
        }

        if (! in_array($user->role, ['admin', 'manager'], true)) {
            return response()->json(['message' => 'Only administrators and managers can manage registered accounts.'], 403);
        }

        $request->attributes->set('authenticatedUser', $user);

        return $next($request);
    }
}
