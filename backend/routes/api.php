<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\MilestoneController;
use App\Http\Controllers\Api\MilestoneFileController;
use App\Http\Controllers\Api\NotificationController;

use App\Http\Controllers\Api\ProjectCommentController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\ProjectFileController;
use App\Http\Controllers\Api\VideoCallController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/client/create-password', [AuthController::class, 'createPassword']);

Route::middleware(['auth:sanctum', 'update.last.seen'])->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/app-closed', [AuthController::class, 'appClosed']);
    Route::post('/test-app-closed', [AuthController::class, 'appClosed']); // Test endpoint

    Route::post('/presence/ping', function (Request $request) {
    $user = $request->user();

    if (! $user) {
        return response()->json(['message' => 'Unauthenticated'], 401);
    }

    $user->forceFill([
        'last_seen_at' => now(),
    ])->save();

    return response()->json([
        'status' => 'ok',
        'user_id' => $user->id,
        'last_seen_at' => $user->last_seen_at,
    ]);
});

    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    Route::get('/clients', [ClientController::class, 'index']);
    Route::post('/clients', [ClientController::class, 'store']);
    Route::get('/clients/{client}', [ClientController::class, 'show']);
    Route::put('/clients/{client}', [ClientController::class, 'update']);
    Route::delete('/clients/{client}', [ClientController::class, 'destroy']);
    Route::post('/clients/{client}/resend-invitation', [ClientController::class, 'resendInvitation']);

    Route::get('/projects', [ProjectController::class, 'index']);
    Route::post('/projects', [ProjectController::class, 'store']);
    Route::get('/projects/{project}', [ProjectController::class, 'show']);
    Route::put('/projects/{project}', [ProjectController::class, 'update']);
    Route::delete('/projects/{project}', [ProjectController::class, 'destroy']);

    Route::get('/projects/{project}/files', [ProjectFileController::class, 'index']);
    Route::post('/projects/{project}/files', [ProjectFileController::class, 'store']);
    Route::delete('/project-files/{projectFile}', [ProjectFileController::class, 'destroy']);
    Route::get('/project-files/{projectFile}/download', [ProjectFileController::class, 'download']);

    Route::get('/projects/{project}/comments', [ProjectCommentController::class, 'index']);
    Route::post('/projects/{project}/comments', [ProjectCommentController::class, 'store']);
    Route::delete('/project-comments/{projectComment}', [ProjectCommentController::class, 'destroy']);



    Route::get('/projects/{project}/milestones', [MilestoneController::class, 'index']);
    Route::post('/projects/{project}/milestones', [MilestoneController::class, 'store']);
    Route::get('/milestones/{milestone}', [MilestoneController::class, 'show']);
    Route::put('/milestones/{milestone}', [MilestoneController::class, 'update']);
    Route::delete('/milestones/{milestone}', [MilestoneController::class, 'destroy']);

    Route::get('/milestones/{milestone}/files', [MilestoneFileController::class, 'index']);
    Route::post('/milestones/{milestone}/files', [MilestoneFileController::class, 'store']);
    Route::delete('/milestone-files/{milestoneFile}', [MilestoneFileController::class, 'destroy']);
    Route::get('/milestone-files/{milestoneFile}/download', [MilestoneFileController::class, 'download']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy']);
    Route::delete('/notifications', [NotificationController::class, 'destroyAll']);

    Route::get('/chat/conversations', [ChatController::class, 'index']);
    Route::get('/chat/conversations/{conversation}', [ChatController::class, 'show']);
    Route::post('/chat/conversations/{conversation}/messages', [ChatController::class, 'sendMessage']);
    Route::post('/chat/conversations/{conversation}/read', [ChatController::class, 'markAsRead']);
    Route::post('/chat/projects/{project}/start', [ChatController::class, 'startFromProject']);
    Route::get('/chat/messages/{message}/download', [ChatController::class, 'downloadMessageFile']);

    Route::get('/video-calls/available-users', [VideoCallController::class, 'getAvailableUsers']);
    Route::get('/video-calls/active', [VideoCallController::class, 'getActiveCall']);
    Route::get('/video-calls/incoming', [VideoCallController::class, 'getIncomingCalls']);
    Route::post('/video-calls/initiate', [VideoCallController::class, 'initiateCall']);
    Route::post('/video-calls/{id}/accept', [VideoCallController::class, 'acceptCall']);
    Route::post('/video-calls/{id}/reject', [VideoCallController::class, 'rejectCall']);
    Route::post('/video-calls/{id}/end', [VideoCallController::class, 'endCall']);
    Route::get('/video-calls/history', [VideoCallController::class, 'getCallHistory']);
    Route::delete('/video-calls/history', [VideoCallController::class, 'deleteAllCallHistory']);
    Route::delete('/video-calls/{id}', [VideoCallController::class, 'deleteCallRecord']);
});