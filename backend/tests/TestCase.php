<?php

namespace Tests;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use App\Models\User;
use Illuminate\Support\Str;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $user = User::factory()->create(['role' => 'admin', 'permission' => 'manage', 'active' => true]);
        $token = Str::random(64);
        $user->forceFill([
            'api_token' => hash('sha256', $token),
            'token_expires_at' => now()->addHour(),
        ])->save();
        $this->withToken($token);
    }

    public function withToken(string $token, string $type = 'Bearer')
    {
        return $this->withHeader('Authorization', $type.' '.$token)
            ->withHeader('X-CSRF-TOKEN', hash_hmac('sha256', $token, (string) config('app.key')));
    }

    protected function issueToken(User $user): string
    {
        $token = Str::random(64);
        $user->forceFill(['api_token' => hash('sha256', $token), 'token_expires_at' => now()->addHour()])->save();
        return $token;
    }

    protected function loginApi(string $email, string $password)
    {
        $csrf = $this->getJson('/api/auth/csrf-token')->assertOk()->json('csrfToken');
        $response = $this->withHeader('X-CSRF-TOKEN', $csrf)
            ->postJson('/api/auth/login', ['email' => $email, 'password' => $password]);
        return $response;
    }
}
