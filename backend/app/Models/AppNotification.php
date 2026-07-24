<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppNotification extends Model
{
    protected $table = 'app_notifications';

    protected $fillable = ['userId', 'title', 'message', 'type', 'read'];

    protected $casts = [
        'read' => 'boolean',
    ];
}
