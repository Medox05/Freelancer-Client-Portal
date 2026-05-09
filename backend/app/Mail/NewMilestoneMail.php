<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class NewMilestoneMail extends Mailable
{
    use Queueable, SerializesModels;

    public $creatorName;
    public $projectName;
    public $milestoneTitle;
    public $projectUrl;

    public function __construct($creatorName, $projectName, $milestoneTitle, $projectUrl)
    {
        $this->creatorName = $creatorName;
        $this->projectName = $projectName;
        $this->milestoneTitle = $milestoneTitle;
        $this->projectUrl = $projectUrl;
    }

    public function build()
    {
        return $this->subject('New Milestone Added in ' . $this->projectName)
                    ->view('emails.new_milestone');
    }
}
