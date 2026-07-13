<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'invoice_number',
        'amount',
        'status',
        'due_date',
        'notes',
        'stripe_session_id',
        'stripe_payment_intent_id'
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
