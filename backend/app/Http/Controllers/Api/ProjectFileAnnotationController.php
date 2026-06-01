<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Notification;
use App\Models\Project;
use App\Models\ProjectFile;
use App\Models\ProjectFileAnnotation;
use App\Models\User;
use Illuminate\Http\Request;

class ProjectFileAnnotationController extends Controller
{
    private function authorizeFile(Request $request, ProjectFile $projectFile)
    {
        $user = $request->user();
        $project = $projectFile->project;

        if (!$project) {
            return false;
        }

        if ($user->role === 'client') {
            $client = Client::where('user_id', $user->id)->first();
            if (!$client || $project->client_id !== $client->id) {
                return false;
            }
        } else {
            if ($project->user_id !== $user->id) {
                return false;
            }
        }

        return true;
    }

    public function index(Request $request, ProjectFile $projectFile)
    {
        if (!$this->authorizeFile($request, $projectFile)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $annotations = $projectFile->annotations()
            ->with('user:id,name,email,role')
            ->oldest()
            ->get()
            ->map(function ($annotation) {
                $annotation->download_url = $annotation->file_path ? url('/api/project-annotations/' . $annotation->id . '/download') : null;
                return $annotation;
            });

        return response()->json($annotations);
    }

    public function store(Request $request, ProjectFile $projectFile)
    {
        if (!$this->authorizeFile($request, $projectFile)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'x_pos' => ['required', 'numeric', 'min:0', 'max:100'],
            'y_pos' => ['required', 'numeric', 'min:0', 'max:100'],
            'comment' => ['nullable', 'string', 'max:2000'],
            'file' => ['nullable', 'file', 'max:20480'], // max 20MB
        ]);

        $user = $request->user();

        $filePath = null;
        $fileName = null;
        $fileMime = null;
        $fileSize = null;

        if ($request->hasFile('file')) {
            $uploadedFile = $request->file('file');
            $filePath = $uploadedFile->store('project-files', 'public');
            $fileName = $uploadedFile->getClientOriginalName();
            $fileMime = $uploadedFile->getClientMimeType();
            $fileSize = $uploadedFile->getSize();
        }

        $annotation = ProjectFileAnnotation::create([
            'project_file_id' => $projectFile->id,
            'user_id' => $user->id,
            'x_pos' => $validated['x_pos'],
            'y_pos' => $validated['y_pos'],
            'comment' => $validated['comment'] ?? '',
            'file_name' => $fileName,
            'file_path' => $filePath,
            'mime_type' => $fileMime,
            'file_size' => $fileSize,
        ]);

        // Send notification to the other party
        $project = $projectFile->project;
        if ($user->role === 'client') {
            // Notify Freelancer
            Notification::create([
                'user_id' => $project->user_id,
                'type' => 'project_file',
                'title' => 'New discussion feedback',
                'message' => "Client left a comment on file: {$projectFile->original_name}",
                'is_read' => false,
                'project_id' => $project->id,
            ]);
        } else {
            // Notify Client
            $client = Client::find($project->client_id);
            if ($client && $client->user_id) {
                Notification::create([
                    'user_id' => $client->user_id,
                    'type' => 'project_file',
                    'title' => 'New discussion feedback',
                    'message' => "Freelancer left a comment on file: {$projectFile->original_name}",
                    'is_read' => false,
                    'project_id' => $project->id,
                ]);
            }
        }

        $loaded = $annotation->load('user:id,name,email,role');
        $loaded->download_url = $loaded->file_path ? url('/api/project-annotations/' . $loaded->id . '/download') : null;

        return response()->json($loaded, 201);
    }

    public function destroy(Request $request, ProjectFileAnnotation $annotation)
    {
        $user = $request->user();
        $projectFile = $annotation->projectFile;
        $project = $projectFile ? $projectFile->project : null;

        if (!$projectFile || !$project) {
            return response()->json(['message' => 'Not found'], 404);
        }

        // Allow deletion if the user created the comment OR if the user is the project owner (freelancer)
        if ($annotation->user_id !== $user->id && ($user->role !== 'freelancer' || $project->user_id !== $user->id)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $annotation->delete();

        return response()->json(['message' => 'Annotation deleted successfully.']);
    }

    public function download(Request $request, ProjectFileAnnotation $annotation)
    {
        $user = $request->user();
        $projectFile = $annotation->projectFile;
        $project = $projectFile ? $projectFile->project : null;

        if (!$projectFile || !$project) {
            return response()->json(['message' => 'Not found'], 404);
        }

        if ($user->role === 'client') {
            $client = Client::where('user_id', $user->id)->first();
            if (!$client || $project->client_id !== $client->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        } else {
            if ($project->user_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        $path = storage_path('app/public/' . $annotation->file_path);

        if (!file_exists($path)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        if ($request->query('inline') === 'true') {
            return response()->file($path);
        }

        return response()->download($path, $annotation->file_name);
    }
}
