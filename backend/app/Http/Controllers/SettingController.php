<?php

namespace App\Http\Controllers;

use App\Models\SystemSetting;
use App\Support\ApplicationTimezone;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

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

        $json = $request->json()->all();
        $payload = array_key_exists('payload', $json) ? $json['payload'] : $json;
        Validator::make(['payload' => $payload], [
            'payload' => ['required', 'array'],
            'payload.timezone' => ['sometimes', 'string', 'timezone'],
        ])->validate();

        $setting = SystemSetting::updateOrCreate(
            ['section' => $section],
            ['payload' => $payload],
        );

        return response()->json($setting);
    }
}
