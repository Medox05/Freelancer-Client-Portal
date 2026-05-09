<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\AppClosedMail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Throwable;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:150', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'freelancer',
        ]);

        return response()->json([
            'token' => $user->createToken('auth_token')->plainTextToken,
            'user' => $user,
        ], 201);
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user) {
            return response()->json([
                'message' => 'Incorrect email or password.',
            ], 422);
        }

        try {
            if (! Hash::check($validated['password'], $user->password)) {
                return response()->json([
                    'message' => 'Incorrect email or password.',
                ], 422);
            }
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Incorrect email or password.',
            ], 422);
        }

        return response()->json([
            'token' => $user->createToken('auth_token')->plainTextToken,
            'user' => $user,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    public function createPassword(Request $request)
{
    $validated = $request->validate([
        'token' => ['required', 'string'],
        'password' => ['required', 'string', 'min:6', 'confirmed'],
    ]);

    $user = \App\Models\User::where('invitation_token', $validated['token'])->first();

    if (! $user) {
        return response()->json([
            'message' => 'Invalid invitation token.',
        ], 404);
    }

    if ($user->invitation_expires_at && now()->greaterThan($user->invitation_expires_at)) {
        return response()->json([
            'message' => 'Invitation token has expired.',
        ], 422);
    }

    $user->update([
        'password' => bcrypt($validated['password']),
        'invitation_token' => null,
        'invitation_accepted_at' => now(),
        'invitation_expires_at' => null,
    ]);

    return response()->json([
        'message' => 'Password created successfully.',
    ]);
}

    public function appClosed(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Send email notification
        Mail::to($user->email)->send(new AppClosedMail($user->name));

        return response()->json([
            'message' => 'App closed notification sent.',
        ]);
    }
}