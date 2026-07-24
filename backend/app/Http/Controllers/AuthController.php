<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', strtolower($validated['email']))->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json(['message' => 'Invalid email or password.'], 422);
        }

        if (! $user->active) {
            return response()->json(['message' => 'This account is inactive.'], 403);
        }

        $user->last_login = now();
        $plainToken = Str::random(64);
        $user->api_token = hash('sha256', $plainToken);
        $user->token_expires_at = now()->addDays(30);
        $user->save();

        return response()->json([
            'user' => $user->fresh(),
            'token' => $plainToken,
        ]);
    }

    public function logout(Request $request)
    {
        $token = $request->bearerToken();
        if ($token) {
            User::where('api_token', hash('sha256', $token))->update([
                'api_token' => null,
                'token_expires_at' => null,
            ]);
        }

        return response()->json(['ok' => true]);
    }

    public function forgotPassword(Request $request)
    {
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
}
