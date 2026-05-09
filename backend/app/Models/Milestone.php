<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Milestone extends Model
{
    protected $fillable = [
        'project_id',
        'title',
        'description',
        'amount',
        'status',
        'due_date',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function comments()
    {
        return $this->hasMany(MilestoneComment::class);
    }

    public function files()
    {
        return $this->hasMany(MilestoneFile::class);
    }
}