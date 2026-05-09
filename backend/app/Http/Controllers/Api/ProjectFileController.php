<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Notification;
use App\Models\Project;
use App\Models\ProjectFile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Mail;
use App\Mail\NewProjectFileMail;

class ProjectFileController extends Controller
{
    public function index(Request $request, Project $project)
    {
        $user = $request->user();

        if ($user->role === 'client') {
            $client = Client::where('user_id', $user->id)->first();

            if (! $client || $project->client_id !== $client->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        } else {
            if ($project->user_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        $files = $project->files()->latest()->get()->map(function ($file) {
            return [
                'id' => $file->id,
                'project_id' => $file->project_id,
                'uploaded_by' => $file->uploaded_by,
                'file_name' => $file->original_name,
                'original_name' => $file->original_name,
                'file_path' => $file->file_path,
                'file_size' => $file->file_size,
                'mime_type' => $file->mime_type,
                'created_at' => optional($file->created_at)?->toDateTimeString(),
                'download_url' => url('/api/project-files/' . $file->id . '/download'),
            ];
        });

        return response()->json($files);
    }

    public function store(Request $request, Project $project)
    {
        $user = $request->user();

        if ($user->role !== 'freelancer' || $project->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'file' => ['required', 'file', 'max:20480'],
        ]);

        $uploadedFile = $validated['file'];
        $filePath = $uploadedFile->store('project-files', 'public');

        $projectFile = ProjectFile::create([
            'project_id' => $project->id,
            'uploaded_by' => $user->id,
            'original_name' => $uploadedFile->getClientOriginalName(),
            'file_path' => $filePath,
            'mime_type' => $uploadedFile->getClientMimeType(),
            'file_size' => $uploadedFile->getSize(),
        ]);

        $client = Client::find($project->client_id);

        if ($client && $client->user_id) {
            $clientUser = User::find($client->user_id);
            if ($clientUser) {
                $projectUrl = rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/') . '/client-projects/' . $project->id;
                Mail::to($clientUser->email)->queue(new NewProjectFileMail($user->name, $project->title, $uploadedFile->getClientOriginalName(), $projectUrl));
            }

            Notification::create([
                'user_id' => $client->user_id,
                'type' => 'project_file',
                'title' => 'New file uploaded',
                'message' => 'A new file was uploaded to project: ' . $project->title,
                'is_read' => false,
                'project_id' => $project->id,
            ]);
        }

        return response()->json([
            'id' => $projectFile->id,
            'project_id' => $projectFile->project_id,
            'uploaded_by' => $projectFile->uploaded_by,
            'file_name' => $projectFile->original_name,
            'original_name' => $projectFile->original_name,
            'file_path' => $projectFile->file_path,
            'file_size' => $projectFile->file_size,
            'mime_type' => $projectFile->mime_type,
            'created_at' => optional($projectFile->created_at)?->toDateTimeString(),
            'download_url' => url('/api/project-files/' . $projectFile->id . '/download'),
        ], 201);
    }

    public function destroy(Request $request, ProjectFile $projectFile)
    {
        $user = $request->user();
        $project = $projectFile->project;

        if (! $project || $user->role !== 'freelancer' || $project->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($projectFile->file_path && Storage::disk('public')->exists($projectFile->file_path)) {
            Storage::disk('public')->delete($projectFile->file_path);
        }

        $projectFile->delete();

        return response()->json([
            'message' => 'File deleted successfully.',
        ]);
    }

    public function download(Request $request, ProjectFile $projectFile)
    {
        $user = $request->user();
        $project = $projectFile->project;

        if (! $project) {
            return response()->json(['message' => 'Project not found'], 404);
        }

        if ($user->role === 'client') {
            $client = Client::where('user_id', $user->id)->first();

            if (! $client || $project->client_id !== $client->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        } else {
            if ($project->user_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        $path = storage_path('app/public/' . $projectFile->file_path);

        if (! file_exists($path)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        return response()->download($path, $projectFile->original_name);
    }
}