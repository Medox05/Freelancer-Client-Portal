<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VideoCall;
use App\Models\User;
use App\Models\Client;
use App\Models\Project;
use Illuminate\Http\Request;

class VideoCallController extends Controller
{
    public function getAvailableUsers(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'freelancer') {
            // Freelancer can call all clients they've created/invited
            $clientIds = Client::where('created_by', $user->id)
                ->whereNotNull('user_id')
                ->pluck('user_id');

            $users = User::where('role', 'client')
                ->where('id', '!=', $user->id)
                ->whereIn('id', $clientIds)
                ->select('id', 'name', 'email', 'last_seen_at', 'invitation_accepted_at')
                ->get();
        } else {
            // Client can call the freelancer who created their profile
            $freelancerIds = Client::where('user_id', $user->id)
                ->pluck('created_by');

            $users = User::where('role', 'freelancer')
                ->whereIn('id', $freelancerIds)
                ->select('id', 'name', 'email', 'last_seen_at', 'invitation_accepted_at')
                ->get();
        }

        return response()->json($users);
    }

    public function initiateCall(Request $request)
    {
        \Log::info('initiateCall hit', ['callee_id' => $request->input('callee_id')]);
        $caller = $request->user();

        $validated = $request->validate([
            'callee_id' => ['required', 'exists:users,id'],
        ]);

        // Auto-expire old ringing calls to prevent getting stuck
        VideoCall::where('status', 'ringing')
            ->where('created_at', '<', \Illuminate\Support\Facades\DB::raw('DATE_SUB(NOW(), INTERVAL 120 SECOND)'))
            ->where(function ($query) use ($caller, $validated) {
                $query->where('caller_id', $caller->id)
                    ->orWhere('callee_id', $caller->id)
                    ->orWhere('caller_id', $validated['callee_id'])
                    ->orWhere('callee_id', $validated['callee_id']);
            })
            ->update(['status' => 'ended', 'ended_at' => now()]);

        // Check if there's already an active call
        $existingCall = VideoCall::with(['caller', 'callee'])->where(function ($query) use ($caller, $validated) {
            $query->where('caller_id', $caller->id)
                ->where('callee_id', $validated['callee_id'])
                ->whereIn('status', ['ringing', 'accepted']);
        })
            ->orWhere(function ($query) use ($caller, $validated) {
                $query->where('caller_id', $validated['callee_id'])
                    ->where('callee_id', $caller->id)
                    ->whereIn('status', ['ringing', 'accepted']);
            })
            ->first();

        // Cleanup ghost accepted calls if a participant went offline
        if ($existingCall && $existingCall->status === 'accepted') {
            $threshold = now()->subMinutes(2);
            // Only end call if both users exist AND both have been seen recently
            $callerExists = $existingCall->caller && $existingCall->caller->last_seen_at;
            $calleeExists = $existingCall->callee && $existingCall->callee->last_seen_at;
            
            if ($callerExists && $calleeExists) {
                $callerOffline = \Carbon\Carbon::parse($existingCall->caller->last_seen_at)->lt($threshold);
                $calleeOffline = \Carbon\Carbon::parse($existingCall->callee->last_seen_at)->lt($threshold);

                if ($callerOffline || $calleeOffline) {
                    $existingCall->update(['status' => 'ended', 'ended_at' => now()]);
                    $existingCall = null;
                }
            }
        }

        if ($existingCall) {
            return response()->json(['message' => 'Call already in progress'], 409);
        }

        $call = VideoCall::create([
            'caller_id' => $caller->id,
            'callee_id' => $validated['callee_id'],
            'status' => 'ringing',
        ]);

        return response()->json($call->load(['caller', 'callee']), 201);
    }

    public function acceptCall(Request $request, $id)
    {
        $user = $request->user();

        $videoCall = VideoCall::find($id);
        
        if (!$videoCall) {
            return response()->json(['message' => 'Call not found'], 404);
        }

        if ($videoCall->callee_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($videoCall->status !== 'ringing') {
            return response()->json(['message' => 'Call cannot be accepted'], 400);
        }

        $videoCall->update([
            'status' => 'accepted',
            'started_at' => now(),
        ]);

        return response()->json($videoCall->load(['caller', 'callee']));
    }

    public function rejectCall(Request $request, $id)
    {
        $user = $request->user();

        $videoCall = VideoCall::find($id);
        
        if (!$videoCall) {
            return response()->json(['message' => 'Call not found'], 404);
        }

        if ($videoCall->callee_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($videoCall->status !== 'ringing') {
            return response()->json(['message' => 'Call cannot be rejected'], 400);
        }

        $videoCall->update([
            'status' => 'rejected',
            'ended_at' => now(),
        ]);

        return response()->json($videoCall);
    }

    public function endCall(Request $request, $id)
    {
        $user = $request->user();

        $videoCall = VideoCall::find($id);
        
        if (!$videoCall) {
            return response()->json(['message' => 'Call not found'], 404);
        }

        if ($videoCall->caller_id !== $user->id && $videoCall->callee_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (!in_array($videoCall->status, ['ringing', 'accepted'])) {
            return response()->json(['message' => 'Call cannot be ended'], 400);
        }

        $videoCall->update([
            'status' => 'ended',
            'ended_at' => now(),
        ]);

        return response()->json($videoCall);
    }

    public function getActiveCall(Request $request)
    {
        $user = $request->user();

        // Auto-expire old ringing calls (older than 120 seconds = 2 minutes)
        VideoCall::where('status', 'ringing')
            ->where('created_at', '<', \Illuminate\Support\Facades\DB::raw('DATE_SUB(NOW(), INTERVAL 120 SECOND)'))
            ->where(function ($query) use ($user) {
                $query->where('caller_id', $user->id)
                    ->orWhere('callee_id', $user->id);
            })
            ->update(['status' => 'ended', 'ended_at' => now()]);

        $call = VideoCall::with(['caller', 'callee'])->where(function ($query) use ($user) {
            $query->where('caller_id', $user->id)
                ->orWhere('callee_id', $user->id);
        })
            ->where(function ($query) {
                $query->whereIn('status', ['ringing', 'accepted'])
                      ->orWhere(function ($q) {
                          $q->whereIn('status', ['rejected', 'ended'])
                            ->where('updated_at', '>=', \Illuminate\Support\Facades\DB::raw('DATE_SUB(NOW(), INTERVAL 10 SECOND)'));
                      });
            })
            ->latest()
            ->first();

        // Only check for offline users if call is accepted AND has been ongoing for at least 30 seconds
        if ($call && $call->status === 'accepted' && $call->started_at && now()->diffInSeconds(\Carbon\Carbon::parse($call->started_at)) >= 30) {
            $threshold = now()->subMinutes(2);
            // Only end call if both users exist AND both have been seen recently
            $callerExists = $call->caller && $call->caller->last_seen_at;
            $calleeExists = $call->callee && $call->callee->last_seen_at;
            
            if ($callerExists && $calleeExists) {
                $callerOffline = \Carbon\Carbon::parse($call->caller->last_seen_at)->lt($threshold);
                $calleeOffline = \Carbon\Carbon::parse($call->callee->last_seen_at)->lt($threshold);

                if ($callerOffline || $calleeOffline) {
                    $call->update([
                        'status' => 'ended',
                        'ended_at' => now(),
                    ]);
                    $call->status = 'ended';
                }
            }
        }

        if (!$call) {
            return response()->json(null);
        }

        return response()->json($call);
    }

    public function getIncomingCalls(Request $request)
    {
        $user = $request->user();

        $calls = VideoCall::where('callee_id', $user->id)
            ->where('status', 'ringing')
            ->with(['caller', 'callee'])
            ->latest()
            ->get();

        return response()->json($calls);
    }

    public function getCallHistory(Request $request)
    {
        $user = $request->user();

        $calls = VideoCall::where(function ($query) use ($user) {
            $query->where('caller_id', $user->id)
                ->orWhere('callee_id', $user->id);
        })
            ->whereIn('status', ['ended', 'rejected'])
            ->with(['caller:id,name,email', 'callee:id,name,email'])
            ->latest()
            ->limit(20)
            ->get();

        return response()->json($calls);
    }

    public function deleteCallRecord(Request $request, $id)
    {
        $user = $request->user();

        $videoCall = VideoCall::find($id);

        if (!$videoCall) {
            return response()->json(['message' => 'Call not found'], 404);
        }

        if ($videoCall->caller_id !== $user->id && $videoCall->callee_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (!in_array($videoCall->status, ['ended', 'rejected'])) {
            return response()->json(['message' => 'Cannot delete an active call'], 400);
        }

        $videoCall->delete();

        return response()->json(['message' => 'Call record deleted']);
    }

    public function deleteAllCallHistory(Request $request)
    {
        $user = $request->user();

        $deleted = VideoCall::where(function ($query) use ($user) {
            $query->where('caller_id', $user->id)
                ->orWhere('callee_id', $user->id);
        })
            ->whereIn('status', ['ended', 'rejected'])
            ->delete();

        return response()->json([
            'message' => 'Call history cleared',
            'deleted_count' => $deleted,
        ]);
    }
}
