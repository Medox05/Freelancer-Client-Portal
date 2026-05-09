<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ClientInvitationMail;
use App\Models\Client;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class ClientController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'freelancer') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $clients = Client::with('user:id,name,email,invitation_token,invitation_expires_at,invitation_accepted_at')
            ->where(function ($query) use ($user) {
                $query->where('created_by', $user->id)
                    ->orWhereHas('projects', function ($projectQuery) use ($user) {
                        $projectQuery->where('user_id', $user->id);
                    });
            })
            ->latest()
            ->get()
            ->unique('id')
            ->values()
            ->map(function ($client) {
                $invitationStatus = ($client->user_id && optional($client->user)->invitation_accepted_at)
                    ? 'accepted'
                    : 'pending';

                return [
                    'id' => $client->id,
                    'user_id' => $client->user_id,
                    'created_by' => $client->created_by,
                    'name' => $client->name,
                    'email' => $client->email,
                    'company' => $client->company,
                    'phone' => $client->phone,
                    'created_at' => $client->created_at,
                    'updated_at' => $client->updated_at,
                    'invitation_status' => $invitationStatus,
                    'user' => $client->user ? [
                        'id' => $client->user->id,
                        'name' => $client->user->name,
                        'email' => $client->user->email,
                        'invitation_token' => $client->user->invitation_token,
                        'invitation_expires_at' => $client->user->invitation_expires_at,
                        'invitation_accepted_at' => $client->user->invitation_accepted_at,
                    ] : null,
                ];
            });

        return response()->json($clients);
    }

    public function store(Request $request)
    {
        $freelancer = $request->user();

        if ($freelancer->role !== 'freelancer') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:150', 'unique:users,email'],
            'company' => ['nullable', 'string', 'max:150'],
            'phone' => ['nullable', 'string', 'max:50'],
        ], [
            'name.required' => 'Name is required.',
            'email.required' => 'Email is required.',
            'email.email' => 'Email is invalid.',
            'email.unique' => 'This email is already taken.',
        ]);

        $token = Str::random(64);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make(Str::random(24)),
            'role' => 'client',
            'invitation_token' => $token,
            'invitation_expires_at' => now()->addDays(2),
            'invitation_accepted_at' => null,
        ]);

        $client = Client::create([
            'user_id' => $user->id,
            'created_by' => $freelancer->id,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'company' => $validated['company'] ?? null,
            'phone' => $validated['phone'] ?? null,
        ]);

        Mail::to($user->email)->send(new ClientInvitationMail($user));

        return response()->json([
            'message' => 'Client created and invitation sent successfully.',
            'client' => [
                'id' => $client->id,
                'user_id' => $client->user_id,
                'created_by' => $client->created_by,
                'name' => $client->name,
                'email' => $client->email,
                'company' => $client->company,
                'phone' => $client->phone,
                'created_at' => $client->created_at,
                'updated_at' => $client->updated_at,
                'invitation_status' => 'pending',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'invitation_token' => $user->invitation_token,
                    'invitation_expires_at' => $user->invitation_expires_at,
                    'invitation_accepted_at' => $user->invitation_accepted_at,
                ],
            ],
        ], 201);
    }

    public function update(Request $request, Client $client)
    {
        $freelancer = $request->user();

        if ($freelancer->role !== 'freelancer') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:150', 'unique:clients,email,' . $client->id],
            'company' => ['nullable', 'string', 'max:150'],
            'phone' => ['nullable', 'string', 'max:50'],
        ], [
            'name.required' => 'Name is required.',
            'email.required' => 'Email is required.',
            'email.email' => 'Email is invalid.',
            'email.unique' => 'This email is already taken.',
        ]);

        $client->update($validated);

        if ($client->user) {
            $client->user->update([
                'name' => $validated['name'],
                'email' => $validated['email'],
            ]);
        }

        $client->load('user:id,name,email,invitation_token,invitation_expires_at,invitation_accepted_at');

        return response()->json([
            'id' => $client->id,
            'user_id' => $client->user_id,
            'created_by' => $client->created_by,
            'name' => $client->name,
            'email' => $client->email,
            'company' => $client->company,
            'phone' => $client->phone,
            'created_at' => $client->created_at,
            'updated_at' => $client->updated_at,
            'invitation_status' => ($client->user_id && optional($client->user)->invitation_accepted_at)
                ? 'accepted'
                : 'pending',
            'user' => $client->user ? [
                'id' => $client->user->id,
                'name' => $client->user->name,
                'email' => $client->user->email,
                'invitation_token' => $client->user->invitation_token,
                'invitation_expires_at' => $client->user->invitation_expires_at,
                'invitation_accepted_at' => $client->user->invitation_accepted_at,
            ] : null,
        ]);
    }

    public function destroy(Request $request, Client $client)
    {
        $freelancer = $request->user();

        if ($freelancer->role !== 'freelancer') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($client->user) {
            $client->user->delete();
        }

        $client->delete();

        return response()->json([
            'message' => 'Client deleted successfully.',
        ]);
    }

    public function resendInvitation(Request $request, Client $client)
    {
        $freelancer = $request->user();

        if ($freelancer->role !== 'freelancer') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (! $client->user) {
            return response()->json(['message' => 'Client user not found.'], 404);
        }

        if ($client->user->invitation_accepted_at) {
            return response()->json([
                'message' => 'This client has already accepted the invitation.',
            ], 422);
        }

        $client->user->update([
            'invitation_token' => Str::random(64),
            'invitation_expires_at' => now()->addDays(2),
            'invitation_accepted_at' => null,
        ]);

        Mail::to($client->user->email)->send(new ClientInvitationMail($client->user));

        return response()->json([
            'message' => 'Invitation resent successfully.',
        ]);
    }
}