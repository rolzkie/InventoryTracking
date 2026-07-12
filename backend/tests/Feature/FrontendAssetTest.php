<?php

namespace Tests\Feature;

use Tests\TestCase;

class FrontendAssetTest extends TestCase
{
    public function test_homepage_serves_built_frontend_assets(): void
    {
        $response = $this->get('/');

        $response->assertOk();
        $response->assertSee('id="root"', false);

        $assetDir = base_path('../dist/assets');
        $files = array_values(array_filter(scandir($assetDir) ?: [], function (string $file): bool {
            return str_ends_with($file, '.js') || str_ends_with($file, '.css');
        }));

        $this->assertNotEmpty($files);

        $assetResponse = $this->get('/assets/' . $files[0]);
        $assetResponse->assertOk();
    }
}
