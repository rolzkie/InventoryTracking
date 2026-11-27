<?php

namespace App\Support;

use App\Models\SystemSetting;
use DateTimeZone;
use Throwable;

class ApplicationTimezone
{
    private static ?string $resolved = null;

    public static function name(): string
    {
        if (self::$resolved !== null) {
            return self::$resolved;
        }

        $general = SystemSetting::query()->where('section', 'general')->value('payload');
        if (is_string($general)) {
            $general = json_decode($general, true);
        }
        $candidate = is_array($general) ? ($general['timezone'] ?? null) : null;

        try {
            self::$resolved = is_string($candidate) && $candidate !== ''
                ? (new DateTimeZone($candidate))->getName()
                : 'Asia/Manila';
        } catch (Throwable) {
            self::$resolved = 'Asia/Manila';
        }

        return self::$resolved;
    }
}
