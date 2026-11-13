<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->attributes->get('authenticatedUser');
        abort_unless($user?->role === 'admin', 403, 'Only administrators can view activity logs.');

        return response()->json(ActivityLog::with('user:id,name,email')->latest('created_at')->paginate(100));
    }
}
