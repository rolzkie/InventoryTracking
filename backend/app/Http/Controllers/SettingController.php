<?php

namespace App\Http\Controllers;

use App\Models\SystemSetting;
use App\Support\ApplicationTimezone;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function timezone()
    {
        return response()->json(['timezone' => ApplicationTimezone::name()]);
    }

    public function index()
    {
        return response()->json(
            SystemSetting::all()->mapWithKeys(fn ($setting) => [$setting->section => $setting->payload]),
        );
    }

    public function update(Request $request, string $section)
    {
        $this->authorizeAdministrator($request, 'Only administrators can change system settings.');

        $validated = $request->validate([
            'payload' => ['required', 'array'],
            'payload.timezone' => ['sometimes', 'string', 'timezone'],
        ]);

        $setting = SystemSetting::updateOrCreate(
            ['section' => $section],
            ['payload' => $validated['payload']],
        );

        return response()->json($setting);
    }
}
