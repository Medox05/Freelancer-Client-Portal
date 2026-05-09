<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClientInvitation extends Model
{
    protected $fillable = [
        'email',
        'token',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];
}