<?php

namespace Tests\Feature;

use Tests\TestCase;

class FrontendAssetTest extends TestCase
{
    public function test_homepage_returns_api_status_message(): void
    {
        $response = $this->get('/');

        $response->assertOk();
        $response->assertJsonPath('message', 'Laravel API is running. Use Vite at http://localhost:5173.');
    }
}
