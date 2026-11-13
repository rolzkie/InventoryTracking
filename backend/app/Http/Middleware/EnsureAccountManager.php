<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAccountManager
{
    public function handle(Request $request, Closure $next): Response
    {
        // AuthenticateApiUser has already resolved either the bearer token or
        // the inventory_auth cookie and attached the validated user.
        $user = $request->attributes->get('authenticatedUser');

        if (! $user) {
            return response()->json(['message' => 'Authentication is required.'], 401);
        }

        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Only administrators can manage registered accounts.'], 403);
        }

        return $next($request);
    }
}
