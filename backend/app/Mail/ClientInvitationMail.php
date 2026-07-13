<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ClientInvitationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public User $user;
    public string $url;

    public function __construct(User $user)
    {
        $this->user = $user;
        $this->url = config('app.frontend_url') . '/create-password?token=' . $user->invitation_token;
    }

    public function build()
    {
        return $this->subject('You are invited to ClientFlow')
            ->view('emails.client-invitation');
    }
}