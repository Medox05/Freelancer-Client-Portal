<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MeetingRequestMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public $requesterName;
    public $meetingTitle;
    public $meetingDate;
    public $actionUrl;

    public function __construct($requesterName, $meetingTitle, $meetingDate, $actionUrl)
    {
        $this->requesterName = $requesterName;
        $this->meetingTitle = $meetingTitle;
        $this->meetingDate = $meetingDate;
        $this->actionUrl = $actionUrl;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'New Meeting Request: ' . $this->meetingTitle,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.meeting_request',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
