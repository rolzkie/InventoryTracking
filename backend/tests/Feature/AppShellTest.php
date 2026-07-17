<?php

namespace Tests\Feature;

use Tests\TestCase;

class AppShellTest extends TestCase
{
    public function test_laravel_serves_the_spa_shell_from_the_root_route(): void
    {
        $response = $this->get('/');

        $response->assertOk();
        $response->assertSee('Enhance ERP Inventory System');
        $response->assertSee('root');
    }
}
