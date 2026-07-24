<?php

namespace Tests\Feature;

use Tests\TestCase;

class TransferPageTest extends TestCase
{
    public function test_transfers_page_serves_the_spa_shell(): void
    {
        $response = $this->get('/transfers');

        $response->assertOk();
        $response->assertHeader('content-type', 'text/html; charset=UTF-8');
        $this->assertSame(
            realpath(base_path('../dist/index.html')),
            realpath($response->baseResponse->getFile()->getPathname()),
        );
    }
}
