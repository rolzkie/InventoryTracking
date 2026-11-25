<?php

namespace App\Http\Controllers;

use App\Models\AppNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    public function index()
    {
        return response()->json(AppNotification::orderByDesc('created_at')->get());
    }

    public function markRead(AppNotification $notification)
    {
        $notification->update(['read' => true]);

        return response()->json($notification->fresh());
    }

    public function markAllRead(Request $request)
    {
        $validated = $request->validate([
            'alertIds' => ['sometimes', 'array', 'max:500'],
            'alertIds.*' => ['required', 'string', 'max:255'],
        ]);
        $actorId = $request->attributes->get('authenticatedUser')?->id;

        DB::transaction(function () use ($validated, $actorId): void {
            AppNotification::where('read', false)->update(['read' => true]);

            $now = now();
            foreach (array_unique($validated['alertIds'] ?? []) as $alertId) {
                DB::table('alert_acknowledgements')->updateOrInsert(
                    ['alertId' => $alertId],
                    [
                        'userId' => $actorId,
                        'acknowledgedAt' => $now,
                    ],
                );
            }
        });

        return response()->json(['ok' => true]);
    }
}
