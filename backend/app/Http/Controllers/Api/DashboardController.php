<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Project;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        $user = $request->user();

        if (strtolower((string) $user->role) === 'freelancer') {
            $totalEarnings = (float) Project::where('user_id', $user->id)
                ->where('status', 'completed')
                ->sum('budget');

            $activeProjects = Project::where('user_id', $user->id)
                ->where('status', 'in_progress')
                ->count();

            $completedProjects = Project::where('user_id', $user->id)
                ->where('status', 'completed')
                ->count();

            $canceledProjects = Project::where('user_id', $user->id)
                ->where('status', 'canceled')
                ->count();

            $totalClients = Client::where('created_by', $user->id)->count();

            $recentProjects = Project::with('client:id,name,email')
                ->where('user_id', $user->id)
                ->latest('id')
                ->take(5)
                ->get();

            $upcomingDeadlines = Project::with('client:id,name,email')
                ->where('user_id', $user->id)
                ->whereNotNull('due_date')
                ->whereNotIn('status', ['completed', 'canceled'])
                ->orderBy('due_date')
                ->take(5)
                ->get();

            return response()->json([
                'role' => 'freelancer',
                'stats' => [
                    'total_clients' => $totalClients,
                    'total_earnings' => $totalEarnings,
                    'active_projects' => $activeProjects,
                    'completed_projects' => $completedProjects,
                    'canceled_projects' => $canceledProjects,
                ],
                'recent_projects' => $recentProjects,
                'upcoming_deadlines' => $upcomingDeadlines,
            ]);
        }

        $client = Client::where('user_id', $user->id)->first();

        if (! $client) {
            return response()->json([
                'role' => 'client',
                'stats' => [
                    'spending' => 0,
                    'active_projects' => 0,
                    'completed_projects' => 0,
                    'canceled_projects' => 0,
                ],
                'recent_projects' => [],
                'upcoming_deadlines' => [],
            ]);
        }

        $spending = (float) Project::where('client_id', $client->id)
            ->where('status', 'completed')
            ->sum('budget');

        $activeProjects = Project::where('client_id', $client->id)
            ->where('status', 'in_progress')
            ->count();

        $completedProjects = Project::where('client_id', $client->id)
            ->where('status', 'completed')
            ->count();

        $canceledProjects = Project::where('client_id', $client->id)
            ->where('status', 'canceled')
            ->count();

        $recentProjects = Project::with('user:id,name,email')
            ->where('client_id', $client->id)
            ->latest('id')
            ->take(5)
            ->get();

        $upcomingDeadlines = Project::with('user:id,name,email')
            ->where('client_id', $client->id)
            ->whereNotNull('due_date')
            ->whereNotIn('status', ['completed', 'canceled'])
            ->orderBy('due_date')
            ->take(5)
            ->get();

        return response()->json([
            'role' => 'client',
            'stats' => [
                'spending' => $spending,
                'active_projects' => $activeProjects,
                'completed_projects' => $completedProjects,
                'canceled_projects' => $canceledProjects,
            ],
            'recent_projects' => $recentProjects,
            'upcoming_deadlines' => $upcomingDeadlines,
        ]);
    }
}