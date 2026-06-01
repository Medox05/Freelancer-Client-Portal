<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'invitation_token',
        'invitation_expires_at',
        'invitation_accepted_at',
        'last_seen_at',
        'email_verified_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];
    protected $casts = [
    'email_verified_at' => 'datetime',
    'last_seen_at' => 'datetime',
    'invitation_expires_at' => 'datetime',
    'invitation_accepted_at' => 'datetime',
    'password' => 'hashed',
];
}