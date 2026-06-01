<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\Project;
use App\Models\Notification;
use Illuminate\Http\Request;

class ContractController extends Controller
{
    public function index(Request $request, $projectId)
    {
        $user = $request->user();
        $project = Project::with('client')->findOrFail($projectId);

        // Check if user is authorized to view this project's contracts
        if ($user->role === 'freelancer') {
            if ($project->user_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        } else {
            if (!$project->client || $project->client->user_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        $contracts = Contract::where('project_id', $projectId)->latest()->get();

        return response()->json($contracts);
    }

    public function store(Request $request, $projectId)
    {
        $user = $request->user();
        $project = Project::findOrFail($projectId);

        // Only project freelancer can create contracts
        if ($user->role !== 'freelancer' || $project->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        $contract = Contract::create([
            'project_id' => $projectId,
            'title' => $validated['title'],
            'content' => $validated['content'],
            'status' => 'draft',
        ]);

        return response()->json($contract, 201);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();
        $contract = Contract::with(['project.client'])->findOrFail($id);
        $project = $contract->project;

        // Check if authorized
        if ($user->role === 'freelancer') {
            if ($project->user_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        } else {
            if (!$project->client || $project->client->user_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        return response()->json($contract);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $contract = Contract::with(['project.client'])->findOrFail($id);
        $project = $contract->project;

        // Only freelancer can edit draft/sent contracts
        if ($user->role !== 'freelancer' || $project->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($contract->status === 'signed') {
            return response()->json(['message' => 'Signed contracts cannot be modified.'], 422);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'status' => 'required|in:draft,sent',
        ]);

        $oldStatus = $contract->status;
        $contract->update($validated);

        // If status transitioned to 'sent', notify the client
        if ($validated['status'] === 'sent' && $oldStatus !== 'sent') {
            if ($project->client && $project->client->user_id) {
                Notification::create([
                    'user_id' => $project->client->user_id,
                    'project_id' => $project->id,
                    'title' => 'New Contract Sent',
                    'message' => "A new contract '{$contract->title}' is ready for your review and signature.",
                    'type' => 'contract_sent',
                ]);
            }
        }

        return response()->json($contract);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $contract = Contract::with('project')->findOrFail($id);

        if ($user->role !== 'freelancer' || $contract->project->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($contract->status === 'signed') {
            return response()->json(['message' => 'Signed contracts cannot be deleted.'], 422);
        }

        $contract->delete();

        return response()->json(['message' => 'Contract deleted successfully.']);
    }

    public function sign(Request $request, $id)
    {
        $user = $request->user();
        $contract = Contract::with(['project.client'])->findOrFail($id);
        $project = $contract->project;

        // Only the assigned project client can sign
        if ($user->role !== 'client' || !$project->client || $project->client->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($contract->status !== 'sent') {
            return response()->json(['message' => 'Only sent contracts can be signed.'], 422);
        }

        $validated = $request->validate([
            'client_signature_name' => 'required|string|max:255',
        ]);

        $contract->update([
            'status' => 'signed',
            'signed_at' => now(),
            'client_signature_name' => $validated['client_signature_name'],
            'signature_ip' => $request->ip(),
        ]);

        // Notify freelancer
        Notification::create([
            'user_id' => $project->user_id,
            'project_id' => $project->id,
            'title' => 'Contract Signed',
            'message' => "L-client '{$user->name}' signed the contract '{$contract->title}'.",
            'type' => 'contract_signed',
        ]);

        return response()->json($contract);
    }
}
