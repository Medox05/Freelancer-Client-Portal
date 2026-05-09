<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Notification;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Mail\ProjectStatusUpdatedMail;

class ProjectController extends Controller
{
    protected function notifyClient(Project $project, string $type, string $title, string $message): void
    {
        $client = Client::find($project->client_id);

        if (! $client || ! $client->user_id) {
            return;
        }

        Notification::create([
            'user_id' => $client->user_id,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'is_read' => false,
            'project_id' => $project->id,
        ]);
    }

    public function index(Request $request)
    {
        $user = $request->user();

        if (strtolower((string) $user->role) === 'client') {
            $client = Client::where('user_id', $user->id)->first();

            if (! $client) {
                return response()->json([]);
            }

            return response()->json(
                Project::with([
                    'client:id,name,email',
                    'user:id,name,email',
                    'files:id,project_id,uploaded_by,original_name,file_path,mime_type,file_size,created_at',
                ])
                    ->where('client_id', $client->id)
                    ->latest()
                    ->get()
            );
        }

        // For freelancers: return projects they created + projects from their clients
        $clientIds = Client::where('created_by', $user->id)->pluck('id');

        return response()->json(
            Project::with([
                'client:id,name,email',
                'user:id,name,email',
                'files:id,project_id,uploaded_by,original_name,file_path,mime_type,file_size,created_at',
            ])
                ->where('user_id', $user->id)
                ->orWhereIn('client_id', $clientIds)
                ->latest()
                ->get()
        );
    }

    public function show(Request $request, Project $project)
    {
        $user = $request->user();

        if (strtolower((string) $user->role) === 'client') {
            $client = Client::where('user_id', $user->id)->first();

            if (! $client || $project->client_id !== $client->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        } else {
            // For freelancers: allow viewing projects they created OR projects from their clients
            $isOwnProject = $project->user_id === $user->id;
            $isClientProject = $project->client_id ? Client::where('id', $project->client_id)->where('created_by', $user->id)->exists() : false;

            if (! $isOwnProject && ! $isClientProject) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        return response()->json(
            $project->load([
                'client:id,name,email',
                'user:id,name,email',
                'files:id,project_id,uploaded_by,original_name,file_path,mime_type,file_size,created_at',
            ])
        );
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $role = strtolower((string) $user->role);

        if ($role === 'freelancer') {
            $validated = $request->validate([
                'client_id' => ['required', 'exists:clients,id'],
                'title' => ['required', 'string', 'max:150'],
                'description' => ['nullable', 'string'],
                'budget' => ['required', 'numeric', 'min:0'],
                'status' => ['required', 'in:pending,in_progress,completed,canceled'],
                'due_date' => ['required', 'date'],
            ]);

            $client = Client::find($validated['client_id']);

            if (! $client || $client->created_by !== $user->id) {
                return response()->json(['message' => 'Unauthorized client'], 403);
            }

            $project = Project::create([
                'user_id' => $user->id,
                'client_id' => $validated['client_id'],
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'budget' => $validated['budget'],
                'status' => $validated['status'],
                'due_date' => $validated['due_date'],
            ]);

            $this->notifyClient(
                $project,
                'project_created',
                'New project created',
                'A new project "' . $project->title . '" was created.'
            );
        } else {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json(
            $project->load([
                'client:id,name,email',
                'user:id,name,email',
                'files:id,project_id,uploaded_by,original_name,file_path,mime_type,file_size,created_at',
            ]),
            201
        );
    }

    public function update(Request $request, Project $project)
    {
        $user = $request->user();
        $role = strtolower((string) $user->role);

        if ($role === 'freelancer') {
            if ($project->user_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $validated = $request->validate([
                'client_id' => ['required', 'exists:clients,id'],
                'title' => ['required', 'string', 'max:150'],
                'description' => ['nullable', 'string'],
                'budget' => ['required', 'numeric', 'min:0'],
                'status' => ['required', 'in:pending,in_progress,completed,canceled'],
                'due_date' => ['required', 'date'],
            ]);

            $client = Client::find($validated['client_id']);

            if (! $client || $client->created_by !== $user->id) {
                return response()->json(['message' => 'Unauthorized client'], 403);
            }

            $oldStatus = $project->status;

            $project->update([
                'client_id' => $validated['client_id'],
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'budget' => $validated['budget'],
                'status' => $validated['status'],
                'due_date' => $validated['due_date'],
            ]);

            if ($oldStatus !== $project->status && $client && $client->user_id) {
                $clientUser = User::find($client->user_id);
                if ($clientUser) {
                    $projectUrl = rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/') . '/client-projects/' . $project->id;
                    Mail::to($clientUser->email)->queue(new ProjectStatusUpdatedMail($user->name, $project->title, $project->status, $projectUrl));
                }
            }

            $this->notifyClient(
                $project,
                'project_updated',
                'Project updated',
                'Project "' . $project->title . '" has been updated.'
            );
        } else {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json(
            $project->load([
                'client:id,name,email',
                'user:id,name,email',
                'files:id,project_id,uploaded_by,original_name,file_path,mime_type,file_size,created_at',
            ])
        );
    }

    public function destroy(Request $request, Project $project)
{
    $user = $request->user();
    $role = strtolower((string) $user->role);

    if ($role === 'freelancer') {
        if ($project->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
    } else {
        return response()->json(['message' => 'Unauthorized'], 403);
    }

    $projectTitle = $project->title;
    $clientId = $project->client_id;

    $client = \App\Models\Client::find($clientId);

    $project->delete();

    if ($client && $client->user_id) {
        \App\Models\Notification::create([
            'user_id' => $client->user_id,
            'type' => 'project_deleted',
            'title' => 'Project deleted',
            'message' => 'The project "' . $projectTitle . '" has been deleted.',
            'is_read' => false,
            'project_id' => null,
        ]);
    }

    return response()->json([
        'message' => 'Project deleted successfully.',
    ]);
}
}