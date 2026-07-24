<?php

namespace App\Http\Controllers;

use App\Models\AppNotification;

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

    public function markAllRead()
    {
        AppNotification::where('read', false)->update(['read' => true]);

        return response()->json(['ok' => true]);
    }
}
