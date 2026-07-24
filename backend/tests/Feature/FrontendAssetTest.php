<?php

namespace Tests\Feature;

use Tests\TestCase;

class FrontendAssetTest extends TestCase
{
    public function test_homepage_serves_the_spa_shell(): void
    {
        $response = $this->get('/');

        $response->assertOk();
        $response->assertHeader('content-type', 'text/html; charset=UTF-8');
        $this->assertSame(
            realpath(base_path('../dist/index.html')),
            realpath($response->baseResponse->getFile()->getPathname()),
        );
    }
}
