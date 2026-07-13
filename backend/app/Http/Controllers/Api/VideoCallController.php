<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VideoCall;
use App\Models\User;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use App\Mail\VideoCallMail;

class VideoCallController extends Controller
{
    public function getAvailableUsers(Request $request)
    {
        $user = $request->user();
        if ($user->role === 'freelancer') {
            // Show all clients who have a user account (user_id set), including those with pending invitations
            $clientIds = Client::where('created_by', $user->id)->whereNotNull('user_id')->pluck('user_id');
            $users = User::whereIn('id', $clientIds)->select('id', 'name', 'email', 'last_seen_at', 'invitation_accepted_at')->get();
        } else {
            $freelancerIds = Client::where('user_id', $user->id)->pluck('created_by');
            $users = User::whereIn('id', $freelancerIds)->select('id', 'name', 'email', 'last_seen_at', 'invitation_accepted_at')->get();
        }
        return response()->json($users);
    }


    public function initiateCall(Request $request)
    {
        $caller = $request->user();
        $validated = $request->validate(['callee_id' => 'required|exists:users,id']);

        // Block the call if the callee is already in an accepted (ongoing) call
        $calleeIsBusy = VideoCall::where('status', 'accepted')
            ->where(function($q) use ($validated) {
                $q->where('caller_id', $validated['callee_id'])
                  ->orWhere('callee_id', $validated['callee_id']);
            })
            ->exists();

        if ($calleeIsBusy) {
            return response()->json(['message' => 'User is currently in another call.'], 409);
        }

        // End any existing active calls for the caller to prevent multi-call bugs
        VideoCall::whereIn('status', ['ringing', 'accepted'])
            ->where(function($q) use ($caller) {
                $q->where('caller_id', $caller->id)->orWhere('callee_id', $caller->id);
            })
            ->update(['status' => 'ended', 'ended_at' => now()]);
        $call = VideoCall::create([
            'caller_id' => $caller->id,
            'callee_id' => $validated['callee_id'],
            'status' => 'ringing',
        ]);

        $callee = User::find($validated['callee_id']);
        if ($callee) {
            $isOffline = !$callee->last_seen_at || $callee->last_seen_at < now()->subMinutes(2);
            if ($isOffline) {
                try {
                    $callUrl = env('FRONTEND_URL', 'http://localhost:5173') . '/calls';
                    Mail::to($callee->email)->queue(new VideoCallMail($caller->name, $callUrl));
                } catch (\Exception $e) {
                    // Ignore email/queue errors to ensure call initiates successfully
                }
            }
        }

        return response()->json($call->load(['caller', 'callee']), 201);
    }

    public function acceptCall(Request $request, $id)
    {
        if (!is_numeric($id)) return response()->json(['message' => 'Invalid call ID'], 400);
        $videoCall = VideoCall::find($id);
        if (!$videoCall) return response()->json(['message' => 'Call not found'], 404);
        
        if ($videoCall->callee_id !== $request->user()->id) return response()->json(['message' => 'Unauthorized'], 403);
        
        $videoCall->update(['status' => 'accepted', 'started_at' => now()]);
        return response()->json($videoCall->load(['caller', 'callee']));
    }

    public function rejectCall(Request $request, $id)
    {
        if (!is_numeric($id)) return response()->json(['message' => 'Invalid call ID'], 400);
        $videoCall = VideoCall::find($id);
        if (!$videoCall) return response()->json(['message' => 'Call not found'], 404);
        
        $videoCall->update(['status' => 'rejected', 'ended_at' => now()]);
        return response()->json($videoCall);
    }

    public function endCall(Request $request, $id)
    {
        if (!is_numeric($id)) return response()->json(['message' => 'Invalid call ID'], 400);
        $videoCall = VideoCall::find($id);
        if (!$videoCall) return response()->json(['message' => 'Call not found'], 404);
        
        $videoCall->update(['status' => 'ended', 'ended_at' => now()]);
        return response()->json($videoCall);
    }

    public function getActiveCall(Request $request)
    {
        $user = $request->user();

        // 1. Actively clean up stale ringing calls (older than 45 seconds)
        VideoCall::where('status', 'ringing')
            ->where('created_at', '<', now()->subSeconds(45))
            ->update(['status' => 'ended', 'ended_at' => now()]);

        // 2. Find the most relevant call for this user
        $call = VideoCall::with(['caller', 'callee'])
            ->where(function ($query) use ($user) {
                $query->where('caller_id', $user->id)->orWhere('callee_id', $user->id);
            })
            ->where(function ($query) {
                $query->whereIn('status', ['ringing', 'accepted'])
                      ->orWhere(function ($q) {
                          $q->whereIn('status', ['rejected', 'ended'])
                            ->where('updated_at', '>=', now()->subSeconds(5)); // Show recently ended state for 5s
                      });
            })
            ->latest('id')
            ->first();

        // 3. Actively clean up stale accepted calls
        // To avoid terminating calls due to temporary network issues, database lag,
        // or background tab throttling (which limits setInterval pings), we only clean up
        // calls active for at least 60 seconds and use a lenient 2-minute presence buffer.
        if ($call && $call->status === 'accepted') {
            $startedAt = $call->started_at;
            if ($startedAt && $startedAt->diffInSeconds(now()) >= 60) {
                $caller = $call->caller;
                $callee = $call->callee;

                $callerOffline = !$caller || !$caller->last_seen_at || $caller->last_seen_at < now()->subSeconds(120);
                $calleeOffline = !$callee || !$callee->last_seen_at || $callee->last_seen_at < now()->subSeconds(120);

                if ($callerOffline || $calleeOffline) {
                    $call->update(['status' => 'ended', 'ended_at' => now()]);
                    // Return ended call state so the active client cleans up immediately
                    return response()->json($call);
                }
            }
        }

        return response()->json($call);
    }

    public function getCallHistory(Request $request)
    {
        $user = $request->user();
        $calls = VideoCall::where(function($q) use ($user) {
                $q->where('caller_id', $user->id)->orWhere('callee_id', $user->id);
            })
            ->whereIn('status', ['ended', 'rejected'])
            ->with(['caller', 'callee'])
            ->latest()
            ->limit(20)
            ->get();
        return response()->json($calls);
    }
}
