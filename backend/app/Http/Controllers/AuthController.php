<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function csrfToken()
    {
        $token = Str::random(64);
        Cache::put('csrf-token:'.hash('sha256', $token), true, now()->addMinutes(10));
        return response()->json(['csrfToken' => $token]);
    }

    public function login(Request $request)
    {
        $this->validateCsrf($request);
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', strtolower($validated['email']))->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            ActivityLog::create([
                'userId' => $user?->id,
                'action' => 'login_failed',
                'subjectType' => 'user',
                'subjectId' => $user ? (string) $user->id : null,
                'details' => ['email' => strtolower($validated['email'])],
                'ipAddress' => $request->ip(),
            ]);
            return response()->json(['message' => 'Invalid email or password.'], 422);
        }

        if (! $user->active) {
            ActivityLog::create([
                'userId' => $user->id,
                'action' => 'login_blocked_inactive',
                'subjectType' => 'user',
                'subjectId' => (string) $user->id,
                'ipAddress' => $request->ip(),
            ]);
            return response()->json(['message' => 'This account is inactive.'], 403);
        }

        $user->last_login = now();
        $plainToken = Str::random(64);
        $user->api_token = hash('sha256', $plainToken);
        $user->token_expires_at = now()->addHours(8);
        $user->save();

        ActivityLog::create([
            'userId' => $user->id,
            'action' => 'login',
            'subjectType' => 'user',
            'subjectId' => (string) $user->id,
            'details' => ['email' => $user->email],
            'ipAddress' => $request->ip(),
        ]);

        return response()->json([
            'user' => $user->fresh(),
            'csrfToken' => hash_hmac('sha256', $plainToken, (string) config('app.key')),
        ])->cookie('inventory_auth', $plainToken, 480, '/', null, $request->isSecure(), true, false, 'Lax');
    }

    public function logout(Request $request)
    {
        $token = $request->bearerToken() ?: $request->cookie('inventory_auth');
        if ($token) {
            $user = User::where('api_token', hash('sha256', $token))->first();
            if ($user) {
                ActivityLog::create([
                    'userId' => $user->id,
                    'action' => 'logout',
                    'subjectType' => 'user',
                    'subjectId' => (string) $user->id,
                    'ipAddress' => $request->ip(),
                ]);
            }
            User::where('api_token', hash('sha256', $token))->update([
                'api_token' => null,
                'token_expires_at' => null,
            ]);
        }

        return response()->json(['ok' => true])->withCookie(cookie()->forget('inventory_auth'));
    }

    public function forgotPassword(Request $request)
    {
        $this->validateCsrf($request);
        $validated = $request->validate(['email' => ['required', 'email']]);
        $user = User::where('email', strtolower($validated['email']))->first();

        if ($user) {
            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $user->email],
                [
                    'token' => Hash::make(Str::random(64)),
                    'created_at' => now(),
                ],
            );
        }

        return response()->json([
            'message' => 'If that account exists, a password reset request has been recorded.',
        ]);
    }

    private function validateCsrf(Request $request): void
    {
        $header = (string) $request->header('X-CSRF-TOKEN');
        $valid = $header !== '' && Cache::pull('csrf-token:'.hash('sha256', $header), false);
        abort_unless($valid, 419, 'A valid or unexpired CSRF token is required.');
    }
}
