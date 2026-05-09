<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Mail\NewMessageMail;

class ChatController extends Controller
{
    /**
     * =========================
     * GET conversations
     * =========================
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // ✅ Ensure conversations exist
        if ($user->role === 'freelancer') {
            $clients = Client::where('created_by', $user->id)
                ->with('user')
                ->get();

            foreach ($clients as $client) {
                if ($client->user_id) {
                    Conversation::firstOrCreate([
                        'freelancer_id' => $user->id,
                        'client_id' => $client->user_id,
                    ]);
                }
            }
        }

        if ($user->role === 'client') {
            $client = Client::where('user_id', $user->id)->first();

            if ($client) {
                Conversation::firstOrCreate([
                    'freelancer_id' => $client->created_by,
                    'client_id' => $user->id,
                ]);
            }
        }

        // ✅ Load conversations
        $conversations = Conversation::with([
            'freelancer',
            'client',
            'latestMessage'
        ])
        ->where('freelancer_id', $user->id)
        ->orWhere('client_id', $user->id)
        ->latest()
        ->get();

        return $conversations->map(function ($conversation) use ($user) {

            $otherUser = $conversation->freelancer_id === $user->id
                ? $conversation->client
                : $conversation->freelancer;

            $unreadCount = Message::where('conversation_id', $conversation->id)
                ->where('sender_id', '!=', $user->id)
                ->where('is_read', false)
                ->count();

            return [
                'id' => $conversation->id,
                'name' => $otherUser?->name,
                'email' => $otherUser?->email,
                'roleLabel' => $otherUser?->role === 'freelancer' ? 'Freelancer' : 'Client',
                'lastMessage' => $conversation->latestMessage?->message ?? '',
                'lastTime' => $conversation->latestMessage?->created_at,
                'unreadCount' => $unreadCount,
                'last_seen_at' => $otherUser?->last_seen_at,
            ];
        });
    }

    /**
     * =========================
     * GET messages
     * =========================
     */
    public function show(Request $request, Conversation $conversation)
    {
        $user = $request->user();

        if ($conversation->freelancer_id !== $user->id &&
            $conversation->client_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // ✅ Mark messages as read
        Message::where('conversation_id', $conversation->id)
            ->where('sender_id', '!=', $user->id)
            ->update(['is_read' => true]);

        $otherUser = $conversation->freelancer_id === $user->id
            ? $conversation->client
            : $conversation->freelancer;

        return response()->json([
            'current_user_id' => $user->id,
            'other_user' => [
                'id' => $otherUser?->id,
                'name' => $otherUser?->name,
                'email' => $otherUser?->email,
                'last_seen_at' => $otherUser?->last_seen_at,
            ],
            'messages' => $conversation->messages()
                ->with('sender')
                ->latest()
                ->get()
                ->map(function ($msg) {
                    return [
                        'id' => $msg->id,
                        'conversation_id' => $msg->conversation_id,
                        'sender_id' => $msg->sender_id,
                        'sender_name' => $msg->sender?->name,
                        'message' => $msg->message,
                        'message_type' => $msg->message_type,
                        'file_name' => $msg->file_name,
                        'file_url' => $msg->file_path
                            ? asset('storage/' . $msg->file_path)
                            : null,
                        'download_url' => url('/api/chat/messages/' . $msg->id . '/download'),
                        'file_size' => $msg->file_size,
                        'is_read' => $msg->is_read,
                        'created_at' => $msg->created_at,
                    ];
                })
                ->reverse()
                ->values(),
        ]);
    }

    /**
     * =========================
     * SEND message (text + multi files)
     * =========================
     */
    public function sendMessage(Request $request, Conversation $conversation)
    {
        $user = $request->user();

        if ($conversation->freelancer_id !== $user->id &&
            $conversation->client_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'message' => ['nullable', 'string'],
            'files.*' => ['file', 'max:20480'],
        ]);

        $messages = [];

        // ✅ TEXT MESSAGE
        if ($request->filled('message')) {
            $messages[] = Message::create([
                'conversation_id' => $conversation->id,
                'sender_id' => $user->id,
                'message' => $request->message,
                'message_type' => 'text',
            ]);
        }

        // ✅ MULTIPLE FILES
        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                $path = $file->store('chat-files', 'public');

                $messages[] = Message::create([
                    'conversation_id' => $conversation->id,
                    'sender_id' => $user->id,
                    'message' => $request->message,
                    'message_type' => 'file',
                    'file_name' => $file->getClientOriginalName(),
                    'file_path' => $path,
                    'file_size' => $file->getSize(),
                ]);
            }
        }

        if (!empty($messages)) {
            $otherUserId = $conversation->freelancer_id === $user->id ? $conversation->client_id : $conversation->freelancer_id;
            $otherUser = User::find($otherUserId);
            
            if ($otherUser) {
                $firstMessageContent = $request->filled('message') ? $request->message : 'Shared a file';
                $chatUrl = env('FRONTEND_URL', 'http://localhost:5173') . '/chat'; // URL for the frontend chat
                Mail::to($otherUser->email)->queue(new NewMessageMail($user->name, $firstMessageContent, $chatUrl));
            }
        }

        return response()->json($messages);
    }

    /**
     * =========================
     * DOWNLOAD FILE
     * =========================
     */
    public function downloadMessageFile(Request $request, Message $message)
    {
        $user = $request->user();
        $conversation = $message->conversation;

        if ($conversation->freelancer_id !== $user->id &&
            $conversation->client_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $path = storage_path('app/public/' . $message->file_path);

        if (!file_exists($path)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        return response()->download($path, $message->file_name);
    }

    /**
     * =========================
     * START CHAT FROM PROJECT
     * =========================
     */
    public function startFromProject(Request $request, Project $project)
    {
        $user = $request->user();

        if ($project->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $client = Client::find($project->client_id);

        if (!$client || !$client->user_id) {
            return response()->json(['message' => 'Client not found'], 404);
        }

        $conversation = Conversation::firstOrCreate([
            'freelancer_id' => $user->id,
            'client_id' => $client->user_id,
        ]);

        return response()->json($conversation);
    }
}