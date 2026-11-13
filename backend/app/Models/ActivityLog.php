<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    public $timestamps = false;

    protected $fillable = ['userId', 'action', 'subjectType', 'subjectId', 'details', 'ipAddress', 'created_at'];

    protected $casts = ['details' => 'array', 'created_at' => 'datetime'];

    public function user()
    {
        return $this->belongsTo(User::class, 'userId');
    }
}
