<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Milestone;
use App\Models\MilestoneFile;
use App\Models\Notification;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MilestoneFileController extends Controller
{
    protected function canAccessProject(Request $request, Project $project): bool
    {
        $user = $request->user();

        if ($user->role === 'client') {
            $client = Client::where('user_id', $user->id)->first();
            return $client && $project->client_id === $client->id;
        }

        return $project->user_id === $user->id;
    }

    public function index(Request $request, Project $project, Milestone $milestone)
    {
        if ($milestone->project_id !== $project->id) {
            return response()->json(['message' => 'Milestone does not belong to this project'], 422);
        }

        if (! $this->canAccessProject($request, $project)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json(
            $milestone->files()->with('uploader:id,name')->get()
        );
    }

    public function store(Request $request, Project $project, Milestone $milestone)
    {
        $user = $request->user();

        if ($milestone->project_id !== $project->id) {
            return response()->json(['message' => 'Milestone does not belong to this project'], 422);
        }

        if ($user->role !== 'freelancer' || $project->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'file' => ['required', 'file', 'max:20480'],
        ]);

        $uploadedFile = $validated['file'];
        $storedName = Str::uuid() . '.' . $uploadedFile->getClientOriginalExtension();
        $filePath = $uploadedFile->storeAs('milestone-files', $storedName, 'public');

        $milestoneFile = MilestoneFile::create([
            'milestone_id' => $milestone->id,
            'uploaded_by' => $user->id,
            'original_name' => $uploadedFile->getClientOriginalName(),
            'stored_name' => $storedName,
            'file_path' => $filePath,
            'mime_type' => $uploadedFile->getMimeType(),
            'file_size' => $uploadedFile->getSize(),
        ]);

        $client = Client::find($project->client_id);

        if ($client && $client->user_id) {
            Notification::create([
                'user_id' => $client->user_id,
                'type' => 'milestone_file',
                'title' => 'New milestone file',
                'message' => "A file was uploaded for milestone '{$milestone->title}'",
                'is_read' => false,
                'project_id' => $project->id,
                'milestone_id' => $milestone->id,
            ]);
        }

        return response()->json($milestoneFile->load('uploader:id,name'), 201);
    }

    public function download(Request $request, Project $project, Milestone $milestone, MilestoneFile $milestoneFile)
    {
        if ($milestone->project_id !== $project->id || $milestoneFile->milestone_id !== $milestone->id) {
            return response()->json(['message' => 'Invalid file relation'], 422);
        }

        if (! $this->canAccessProject($request, $project)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (! Storage::disk('public')->exists($milestoneFile->file_path)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        return Storage::disk('public')->download(
            $milestoneFile->file_path,
            $milestoneFile->original_name
        );
    }

    public function destroy(Request $request, Project $project, Milestone $milestone, MilestoneFile $milestoneFile)
    {
        $user = $request->user();

        if ($milestone->project_id !== $project->id || $milestoneFile->milestone_id !== $milestone->id) {
            return response()->json(['message' => 'Invalid file relation'], 422);
        }

        if ($user->role !== 'freelancer' || $project->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (Storage::disk('public')->exists($milestoneFile->file_path)) {
            Storage::disk('public')->delete($milestoneFile->file_path);
        }

        $milestoneFile->delete();

        return response()->json([
            'message' => 'Milestone file deleted successfully.',
        ]);
    }
}