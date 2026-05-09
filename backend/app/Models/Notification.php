<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'title',
        'message',
        'is_read',
        'project_id',
        'milestone_id',
        'conversation_id',
    ];

    protected $casts = [
        'is_read' => 'boolean',
    ];
}
