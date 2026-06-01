<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Contract extends Model
{
    protected $fillable = [
        'project_id',
        'title',
        'content',
        'status',
        'signed_at',
        'client_signature_name',
        'signature_ip',
    ];

    protected $casts = [
        'signed_at' => 'datetime',
    ];

    /**
     * Relationship to the Project.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
