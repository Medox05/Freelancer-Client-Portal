<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Notification;
use App\Models\Project;
use App\Models\ProjectComment;
use Illuminate\Http\Request;

class ProjectCommentController extends Controller
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

    public function index(Request $request, Project $project)
    {
        if (! $this->canAccessProject($request, $project)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json(
            $project->comments()->with('user:id,name,email,role')->orderBy('created_at', 'asc')->get()
        );
    }

    public function store(Request $request, Project $project)
    {
        if (! $this->canAccessProject($request, $project)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $comment = ProjectComment::create([
            'project_id' => $project->id,
            'user_id' => $request->user()->id,
            'message' => $validated['message'],
        ]);

        $comment->load('user:id,name,email,role');

        $author = $request->user();
        $receiverUserId = null;

        if ($author->role === 'freelancer') {
            $receiverUserId = $project->client?->user_id;
        } else {
            $receiverUserId = $project->user_id;
        }

        if ($receiverUserId && $receiverUserId !== $author->id) {
            Notification::create([
    'user_id' => $receiverUserId,
    'project_id' => $project->id,
    'title' => 'New project comment',
    'message' => $author->name . ' commented on project "' . $project->title . '".',
    'type' => 'project_comment',
    'is_read' => false,
]);

        }

        return response()->json($comment, 201);
    }

    public function destroy(Request $request, ProjectComment $projectComment)
    {
        $project = $projectComment->project;
        $user = $request->user();

        if (! $this->canAccessProject($request, $project)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($projectComment->user_id !== $user->id) {
            return response()->json(['message' => 'You can only delete your own comments.'], 403);
        }

        $projectComment->delete();

        return response()->json([
            'message' => 'Comment deleted successfully.',
        ]);
    }
}