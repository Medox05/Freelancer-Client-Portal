<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    protected $fillable = [
        'user_id',
        'client_id',
        'title',
        'description',
        'budget',
        'status',
        'due_date',
    ];

    protected $casts = [
        'budget' => 'decimal:2',
        'due_date' => 'date',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function files()
    {
        return $this->hasMany(ProjectFile::class);
    }

    public function milestones()
    {
        return $this->hasMany(Milestone::class);
    }

    public function comments()
    {
        return $this->hasMany(ProjectComment::class)->latest();
    }


}