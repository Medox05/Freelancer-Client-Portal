<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AppClosedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $userName;
    public $closedAt;

    public function __construct($userName, $closedAt = null)
    {
        $this->userName = $userName;
        $this->closedAt = $closedAt ?? now()->format('Y-m-d H:i:s');
    }

    public function build()
    {
        return $this->subject('App Closed - ' . $this->userName)
                    ->view('emails.app_closed');
    }
}
