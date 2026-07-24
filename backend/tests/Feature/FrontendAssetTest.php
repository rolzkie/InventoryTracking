<?php

namespace Tests\Feature;

use Tests\TestCase;

class FrontendAssetTest extends TestCase
{
    public function test_homepage_serves_the_spa_shell(): void
    {
        $response = $this->get('/');

        $response->assertOk();
        $this->assertStringContainsString('Enhance ERP Inventory System', $response->getContent());
        $this->assertStringContainsString('id="root"', $response->getContent());
    }
}
