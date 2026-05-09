<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ProjectStatusUpdatedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $freelancerName;
    public $projectName;
    public $newStatus;
    public $projectUrl;

    public function __construct($freelancerName, $projectName, $newStatus, $projectUrl)
    {
        $this->freelancerName = $freelancerName;
        $this->projectName = $projectName;
        $this->newStatus = $newStatus;
        $this->projectUrl = $projectUrl;
    }

    public function build()
    {
        $statusFormatted = ucwords(str_replace('_', ' ', $this->newStatus));
        return $this->subject("Project Status Updated: {$this->projectName} is now {$statusFormatted}")
                    ->view('emails.project_status_updated');
    }
}
