<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MilestoneFile extends Model
{
    protected $fillable = [
        'milestone_id',
        'uploaded_by',
        'original_name',
        'stored_name',
        'file_path',
        'mime_type',
        'file_size',
    ];

    public function milestone()
    {
        return $this->belongsTo(Milestone::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}