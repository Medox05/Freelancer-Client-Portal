import { useQuery } from "@tanstack/react-query";
import {
  Ban,
  CheckCircle2,
  ClipboardList,
  Eye,
  FolderKanban,
  LoaderCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getDashboardStats } from "../services/dashboard-service";

function formatDateOnly(dateString?: string | null) {
  if (!dateString) return "—";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString.split("T")[0] || "—";
  }

  return date.toLocaleDateString("fr-CA");
}

function isProjectExpired(dueDate?: string | null, status?: string) {
  if (!dueDate || status === "completed" || status === "canceled") return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  return due < today;
}

export default function ClientDashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["client-dashboard-stats"],
    queryFn: getDashboardStats,
  });

  const stats = data?.stats || {
    total_projects: 0,
    active_projects: 0,
    completed_projects: 0,
    canceled_projects: 0,
    pending_projects: 0,
  };

  const recentProjects = data?.recent_projects || [];
  const upcomingDeadlines = data?.upcoming_deadlines || [];
  const chartData = data?.chart_data || [];

  const isDark = document.documentElement.classList.contains("dark");
  const chartColor = isDark ? "#60a5fa" : "#2563eb";

  const getStatusClass = (status: string) => {
    if (status === "completed") {
      return "border border-green-500 bg-green-100 text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300";
    }

    if (status === "in_progress") {
      return "border border-blue-500 bg-blue-100 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300";
    }

    if (status === "canceled") {
      return "border border-red-500 bg-red-100 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300";
    }

    return "border border-orange-500 bg-orange-100 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300";
  };

  const formatStatus = (status: string) => status.replace("_", " ");

  if (isLoading) {
    return (
      <div className="text-slate-500 dark:text-slate-400">
        Loading dashboard...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-red-600 dark:text-red-300">
        Failed to load dashboard.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold">Client Dashboard</h2>
        <p className="text-slate-500 dark:text-slate-400">
          Overview of your projects and deadlines.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <p className="text-slate-500 dark:text-slate-400">My Projects</p>
            <div className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
              <FolderKanban size={22} />
            </div>
          </div>
          <p className="mt-6 text-5xl font-bold">{stats.total_projects}</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <p className="text-slate-500 dark:text-slate-400">In Progress</p>
            <div className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
              <LoaderCircle size={22} />
            </div>
          </div>
          <p className="mt-6 text-5xl font-bold">{stats.active_projects}</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <p className="text-slate-500 dark:text-slate-400">Completed</p>
            <div className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
              <CheckCircle2 size={22} />
            </div>
          </div>
          <p className="mt-6 text-5xl font-bold">{stats.completed_projects}</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <p className="text-slate-500 dark:text-slate-400">Pending</p>
            <div className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
              <ClipboardList size={22} />
            </div>
          </div>
          <p className="mt-6 text-5xl font-bold">{stats.pending_projects}</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <p className="text-slate-500 dark:text-slate-400">Canceled</p>
            <div className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
              <Ban size={22} />
            </div>
          </div>
          <p className="mt-6 text-5xl font-bold">{stats.canceled_projects}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-2xl font-semibold mb-6">Spending Over Time</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={isDark ? "#334155" : "#e2e8f0"}
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 13 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 13 }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                cursor={{ fill: isDark ? "#1e293b" : "#f1f5f9" }}
                contentStyle={{
                  backgroundColor: isDark ? "#0f172a" : "#ffffff",
                  borderColor: isDark ? "#334155" : "#e2e8f0",
                  borderRadius: "16px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                }}
                itemStyle={{ color: isDark ? "#f8fafc" : "#0f172a", fontWeight: "bold" }}
                formatter={(value: any) => [`$${Number(value).toLocaleString()}`, "Spending"]}
              />
              <Bar
                dataKey="total"
                fill={chartColor}
                radius={[6, 6, 6, 6]}
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-2xl font-semibold">Upcoming Deadlines</h3>

          <div className="mt-6 space-y-4">
            {upcomingDeadlines.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400">
                No upcoming deadlines.
              </p>
            ) : (
              upcomingDeadlines.map((project: any) => (
                <div
                  key={project.id}
                  className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/60"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p
                        className="truncate text-2xl font-semibold"
                        title={project.title}
                      >
                        {project.title}
                      </p>
                      <p className="mt-2 text-slate-500 dark:text-slate-400">
                        Deadline: {formatDateOnly(project.due_date)}
                        {isProjectExpired(project.due_date, project.status) && (
                          <span className="ml-2 text-xs font-medium text-red-600 dark:text-red-400">
                            (Expired)
                          </span>
                        )}
                      </p>
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                        project.status
                      )}`}
                    >
                      {formatStatus(project.status)}
                    </span>
                  </div>

                  <div className="mt-4">
                    <Link
                      to={`/client-projects/${project.id}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-blue-600 bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-200 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
                    >
                      <Eye size={16} />
                      View
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-2xl font-semibold">Recent Projects</h3>

          <div className="mt-6 space-y-4">
            {recentProjects.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400">
                No recent projects.
              </p>
            ) : (
              recentProjects.map((project: any) => (
                <div
                  key={project.id}
                  className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/60"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-2xl font-semibold"
                        title={project.title}
                      >
                        {project.title}
                      </p>

                      <p
                        className="mt-2 truncate text-slate-500 dark:text-slate-400"
                        title={project.description || ""}
                      >
                        {project.description || "No description available."}
                      </p>
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                        project.status
                      )}`}
                    >
                      {formatStatus(project.status)}
                    </span>
                  </div>

                  <div className="mt-4">
                    <Link
                      to={`/client-projects/${project.id}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-blue-600 bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-200 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
                    >
                      <Eye size={16} />
                      View
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}