<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class NewProjectFileMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $uploaderName;
    public $projectName;
    public $fileName;
    public $projectUrl;

    public function __construct($uploaderName, $projectName, $fileName, $projectUrl)
    {
        $this->uploaderName = $uploaderName;
        $this->projectName = $projectName;
        $this->fileName = $fileName;
        $this->projectUrl = $projectUrl;
    }

    public function build()
    {
        return $this->subject('New File Uploaded in ' . $this->projectName)
                    ->view('emails.new_project_file');
    }
}
