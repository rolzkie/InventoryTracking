<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Http\Request;

class InventoryActivityLogger
{
    public function log(
        Request $request,
        string $action,
        string $subjectType,
        string|int|null $subjectId,
        array $details,
    ): void {
        $actor = $request->attributes->get('authenticatedUser');

        ActivityLog::create([
            'userId' => $actor?->id,
            'action' => $action,
            'subjectType' => $subjectType,
            'subjectId' => $subjectId === null ? null : (string) $subjectId,
            'details' => $details,
            'ipAddress' => $request->ip(),
        ]);

        $request->attributes->set('detailedInventoryActivityLogged', true);
    }
}
