<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Meeting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Mail\MeetingRequestMail;
use Carbon\Carbon;

class MeetingController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        $meetings = Meeting::where('freelancer_id', $user->id)
            ->orWhere('client_id', $user->id)
            ->with(['freelancer:id,name,email', 'client:id,name,email'])
            ->orderBy('start_time', 'asc')
            ->get();

        return response()->json($meetings);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'other_user_id' => 'required|exists:users,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
        ]);

        $otherUser = User::find($validated['other_user_id']);

        $freelancerId = $user->role === 'freelancer' ? $user->id : $otherUser->id;
        $clientId = $user->role === 'client' ? $user->id : $otherUser->id;

        $meeting = Meeting::create([
            'freelancer_id' => $freelancerId,
            'client_id' => $clientId,
            'created_by' => $user->id,
            'title' => $validated['title'],
            'description' => $validated['description'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'status' => 'pending',
        ]);

        try {
            $actionUrl = env('FRONTEND_URL', 'http://localhost:5173') . '/meetings';
            $meetingDate = Carbon::parse($validated['start_time'])->format('l, F j, Y \a\t g:i A');
            Mail::to($otherUser->email)->queue(new MeetingRequestMail($user->name, $validated['title'], $meetingDate, $actionUrl));
        } catch (\Exception $e) {
            // Ignore email errors if smtp is not configured perfectly
        }

        \App\Models\Notification::create([
            'user_id' => $otherUser->id,
            'title' => 'New Meeting Request',
            'message' => "{$user->name} has requested a meeting: {$validated['title']}",
            'type' => 'meeting_request'
        ]);

        return response()->json($meeting->load(['freelancer:id,name', 'client:id,name']), 201);
    }

    public function updateStatus(Request $request, Meeting $meeting)
    {
        $user = $request->user();

        if ($meeting->freelancer_id !== $user->id && $meeting->client_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:confirmed,cancelled,completed'
        ]);

        $meeting->update(['status' => $validated['status']]);

        $otherUserId = $meeting->freelancer_id === $user->id ? $meeting->client_id : $meeting->freelancer_id;
        \App\Models\Notification::create([
            'user_id' => $otherUserId,
            'title' => 'Meeting Status Updated',
            'message' => "{$user->name} has {$validated['status']} the meeting: {$meeting->title}",
            'type' => "meeting_{$validated['status']}"
        ]);

        return response()->json($meeting->load(['freelancer:id,name', 'client:id,name']));
    }

    public function destroy(Request $request, Meeting $meeting)
    {
        $user = $request->user();

        if ($meeting->freelancer_id !== $user->id && $meeting->client_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $meeting->delete();

        return response()->json(['message' => 'Meeting deleted successfully']);
    }
}
