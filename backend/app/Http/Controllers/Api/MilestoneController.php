<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Milestone;
use App\Models\Notification;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Mail\NewMilestoneMail;

class MilestoneController extends Controller
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

        return response()->json(
            $project->milestones()->latest()->get()
        );
    }

    public function show(Request $request, Milestone $milestone)
    {
        $user = $request->user();
        $project = $milestone->project;

        if (! $project) {
            return response()->json(['message' => 'Milestone not found'], 404);
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

        return response()->json($milestone->load(['files', 'comments']));
    }

    public function store(Request $request, Project $project)
    {
        $user = $request->user();

        if ($user->role !== 'freelancer' || $project->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'in:pending,in_progress,completed,canceled'],
            'due_date' => ['nullable', 'date'],
        ]);

        $milestone = Milestone::create([
            'project_id' => $project->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'],
            'due_date' => $validated['due_date'] ?? null,
        ]);

        $client = Client::find($project->client_id);

        if ($client && $client->user_id) {
            $clientUser = User::find($client->user_id);
            if ($clientUser) {
                $projectUrl = rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/') . '/client-projects/' . $project->id;
                Mail::to($clientUser->email)->queue(new NewMilestoneMail($user->name, $project->title, $milestone->title, $projectUrl));
            }

            Notification::create([
                'user_id' => $client->user_id,
                'type' => 'milestone_created',
                'title' => 'New milestone added',
                'message' => 'A new milestone was added to project: ' . $project->title,
                'is_read' => false,
                'project_id' => $project->id,
                'milestone_id' => $milestone->id,
            ]);
        }

        return response()->json($milestone, 201);
    }

    public function update(Request $request, Milestone $milestone)
    {
        $user = $request->user();
        $project = $milestone->project;

        if (! $project || $user->role !== 'freelancer' || $project->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'in:pending,in_progress,completed,canceled'],
            'due_date' => ['nullable', 'date'],
        ]);

        $milestone->update([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'],
            'due_date' => $validated['due_date'] ?? null,
        ]);

        $client = Client::find($project->client_id);

        if ($client && $client->user_id) {
            Notification::create([
                'user_id' => $client->user_id,
                'type' => 'milestone_updated',
                'title' => 'Milestone updated',
                'message' => 'A milestone was updated in project: ' . $project->title,
                'is_read' => false,
                'project_id' => $project->id,
                'milestone_id' => $milestone->id,
            ]);
        }

        return response()->json($milestone);
    }

    public function destroy(Request $request, Milestone $milestone)
    {
        $user = $request->user();
        $project = $milestone->project;

        if (! $project || $user->role !== 'freelancer' || $project->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $milestoneTitle = $milestone->title;

        Notification::where('milestone_id', $milestone->id)->delete();

        $milestone->files()->delete();
        $milestone->comments()->delete();
        $milestone->delete();

        $client = Client::find($project->client_id);

        if ($client && $client->user_id) {
            Notification::create([
                'user_id' => $client->user_id,
                'type' => 'milestone_deleted',
                'title' => 'Milestone removed',
                'message' => 'Milestone "' . $milestoneTitle . '" was removed from project: ' . $project->title,
                'is_read' => false,
                'project_id' => $project->id,
                'milestone_id' => null,
            ]);
        }

        return response()->json([
            'message' => 'Milestone deleted successfully.',
        ]);
    }
}