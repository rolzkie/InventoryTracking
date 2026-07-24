<?php

namespace Tests\Feature;

use Tests\TestCase;

class WarehousePageTest extends TestCase
{
    public function test_warehouses_page_serves_the_spa_shell(): void
    {
        $response = $this->get('/warehouses');

        $response->assertOk();
        $response->assertHeader('content-type', 'text/html; charset=UTF-8');
        $this->assertSame(
            realpath(base_path('../dist/index.html')),
            realpath($response->baseResponse->getFile()->getPathname()),
        );
    }
}
