<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    protected $fillable = ['section', 'payload'];

    protected $casts = [
        'payload' => 'array',
    ];
}
