<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectFileAnnotation extends Model
{
    protected $fillable = [
        'project_file_id',
        'user_id',
        'x_pos',
        'y_pos',
        'comment',
        'file_name',
        'file_path',
        'mime_type',
        'file_size',
    ];

    protected $casts = [
        'x_pos' => 'float',
        'y_pos' => 'float',
    ];

    public function projectFile()
    {
        return $this->belongsTo(ProjectFile::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
