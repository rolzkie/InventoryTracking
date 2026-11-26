<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AlertAcknowledgementController extends Controller
{
    public function index()
    {
        return response()->json(
            DB::table('alert_acknowledgements')->pluck('alertId')->values(),
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'alertId' => ['required', 'string', 'max:255'],
        ]);
        $actor = $request->attributes->get('authenticatedUser');

        DB::table('alert_acknowledgements')->updateOrInsert(
            ['alertId' => $validated['alertId']],
            [
                'userId' => $actor->id,
                'acknowledgedAt' => now(),
            ],
        );

        return response()->json(['ok' => true], 201);
    }
}
