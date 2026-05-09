<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $notifications = Notification::where('user_id', $user->id)
            ->latest()
            ->get();

        return response()->json($notifications);
    }

    public function markAsRead(Request $request, Notification $notification)
    {
        $user = $request->user();

        if ($notification->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $notification->update([
            'is_read' => true,
        ]);

        return response()->json([
            'message' => 'Notification marked as read.',
        ]);
    }

    public function markAllAsRead(Request $request)
    {
        $user = $request->user();

        Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
            ]);

        return response()->json([
            'message' => 'All notifications marked as read.',
        ]);
    }

    public function destroy(Request $request, Notification $notification)
    {
        $user = $request->user();

        if ($notification->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $notification->delete();

        return response()->json([
            'message' => 'Notification deleted successfully.',
        ]);
    }

    public function destroyAll(Request $request)
    {
        $user = $request->user();

        Notification::where('user_id', $user->id)->delete();

        return response()->json([
            'message' => 'All notifications deleted successfully.',
        ]);
    }
}