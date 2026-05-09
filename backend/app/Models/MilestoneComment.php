<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class MilestoneComment extends Model
{
    protected $fillable = [
        'milestone_id',
        'user_id',
        'comment',
        'file_name',
        'file_path',
        'mime_type',
        'file_size',
    ];

    protected $casts = [
        'file_size' => 'integer',
    ];

    protected $appends = [
        'file_url',
        'download_url',
    ];

    public function getFileUrlAttribute(): ?string
    {
        if (! $this->file_path) {
            return null;
        }

        return asset('storage/' . $this->file_path);
    }

    public function getDownloadUrlAttribute(): ?string
    {
        if (! $this->file_path || ! $this->milestone) {
            return null;
        }

        $projectId = $this->milestone->project_id;

        return url("/api/projects/{$projectId}/milestones/{$this->milestone_id}/comments/{$this->id}/download");
    }

    public function milestone()
    {
        return $this->belongsTo(Milestone::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}