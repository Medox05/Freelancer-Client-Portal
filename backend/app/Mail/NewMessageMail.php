<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class NewMessageMail extends Mailable
{
    use Queueable, SerializesModels;

    public $senderName;
    public $messageContent;
    public $chatUrl;

    public function __construct($senderName, $messageContent, $chatUrl)
    {
        $this->senderName = $senderName;
        $this->messageContent = $messageContent;
        $this->chatUrl = $chatUrl;
    }

    public function build()
    {
        return $this->subject('New Message from ' . $this->senderName)
                    ->view('emails.new_message');
    }
}
