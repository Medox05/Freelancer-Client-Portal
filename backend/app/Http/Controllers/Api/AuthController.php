<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\AppClosedMail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use App\Mail\ResetPasswordMail;
use App\Mail\VerifyEmailMail;
use Throwable;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email:rfc,dns', 'max:150', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ], [
            'email.email' => 'This email address does not exist.',
        ]);

        $code = rand(100000, 999999);
        $pendingUser = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'freelancer',
            'code' => $code
        ];

        Cache::put('pending_user_' . $validated['email'], $pendingUser, now()->addMinutes(15));

        try {
            Mail::to($validated['email'])->send(new VerifyEmailMail($code));
        } catch (\Exception $e) {
            Cache::forget('pending_user_' . $validated['email']);
            return response()->json([
                'errors' => [
                    'email' => ['This email address does not exist or cannot receive emails.']
                ]
            ], 422);
        }

        return response()->json([
            'message' => 'Registration successful. Please verify your email.',
            'require_verification' => true,
            'email' => $validated['email'],
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

        if (is_null($user->email_verified_at)) {
            return response()->json([
                'message' => 'Please verify your email address.',
                'require_verification' => true,
                'email' => $user->email,
            ], 403);
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
        'email_verified_at' => now(), // Client email is verified via invitation
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

    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email', 'exists:users,email'],
        ]);

        $code = rand(100000, 999999);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $request->email],
            ['token' => $code, 'created_at' => now()]
        );

        Mail::to($request->email)->send(new ResetPasswordMail($code));

        return response()->json([
            'message' => 'Password reset code sent to your email.',
        ]);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email', 'exists:users,email'],
            'code' => ['required', 'string'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        $resetToken = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->where('token', $request->code)
            ->first();

        if (!$resetToken || now()->subMinutes(15)->greaterThan($resetToken->created_at)) {
            return response()->json([
                'message' => 'Invalid or expired reset code.',
            ], 400);
        }

        $user = User::where('email', $request->email)->first();
        $user->update([
            'password' => Hash::make($request->password),
        ]);

        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json([
            'message' => 'Password has been reset successfully.',
        ]);
    }

    public function verifyEmail(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
            'code' => ['required', 'string'],
        ]);

        $pendingUser = Cache::get('pending_user_' . $request->email);

        if (!$pendingUser || $pendingUser['code'] != $request->code) {
            return response()->json([
                'message' => 'Invalid or expired verification code.',
            ], 400);
        }

        if (User::where('email', $request->email)->exists()) {
            return response()->json([
                'message' => 'This email is already registered.',
            ], 422);
        }

        $user = User::create([
            'name' => $pendingUser['name'],
            'email' => $pendingUser['email'],
            'password' => $pendingUser['password'],
            'role' => $pendingUser['role'],
            'email_verified_at' => now(),
        ]);

        Cache::forget('pending_user_' . $request->email);

        return response()->json([
            'message' => 'Email verified successfully.',
            'token' => $user->createToken('auth_token')->plainTextToken,
            'user' => $user,
        ]);
    }

    public function resendVerification(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        if (User::where('email', $request->email)->exists()) {
            return response()->json([
                'message' => 'Email is already registered and verified.',
            ], 400);
        }

        $pendingUser = Cache::get('pending_user_' . $request->email);

        if (!$pendingUser) {
            return response()->json([
                'message' => 'Verification session expired. Please register again.',
            ], 400);
        }

        $code = rand(100000, 999999);
        $pendingUser['code'] = $code;
        Cache::put('pending_user_' . $request->email, $pendingUser, now()->addMinutes(15));

        try {
            Mail::to($request->email)->send(new VerifyEmailMail($code));
        } catch (\Exception $e) {
            return response()->json([
                'errors' => [
                    'email' => ['Failed to send verification email. Ensure your email is correct.']
                ]
            ], 422);
        }

        return response()->json([
            'message' => 'Verification code resent successfully.',
        ]);
    }
}