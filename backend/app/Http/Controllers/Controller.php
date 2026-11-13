<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

abstract class Controller
{
    protected function authorizeAdministrator(Request $request, string $message = 'Only administrators may perform this action.'): void
    {
        abort_unless($request->attributes->get('authenticatedUser')?->role === 'admin', 403, $message);
    }
}
