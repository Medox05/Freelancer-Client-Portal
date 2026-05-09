import { useQuery } from "@tanstack/react-query";
import {
  Ban,
  CheckCircle2,
  DollarSign,
  Eye,
  FolderKanban,
  Users,

} from "lucide-react";
import { Link } from "react-router-dom";
import { getDashboardStats } from "../services/dashboard-service";

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {title}
        </p>
        <div className="rounded-2xl bg-slate-100 p-3 dark:bg-slate-800">
          {icon}
        </div>
      </div>

      <p className="mt-5 text-4xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

function getStatusClass(status: string) {
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
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function formatMoney(value?: number) {
  return `$${Number(value || 0).toLocaleString()}`;
}

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

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
  });

  if (isLoading) {
    return (
      <div className="text-slate-500 dark:text-slate-400">
        Loading dashboard...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-red-600 dark:text-red-300">
        Failed to load dashboard.
      </div>
    );
  }

  const { role, stats, recent_projects, upcoming_deadlines } = data;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <p className="text-slate-500 dark:text-slate-400">
          {role === "freelancer"
            ? "Track your clients, earnings and projects."
            : "Track your spending and project progress."}
        </p>
      </div>

      {role === "freelancer" ? (
        <>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
            <StatCard
              title="Clients"
              value={stats.total_clients || 0}
              icon={<Users size={22} />}
            />
            <StatCard
              title="Total Earnings"
              value={formatMoney(stats.total_earnings)}
              icon={<DollarSign size={22} />}
            />
            <StatCard
              title="Active Projects"
              value={stats.active_projects}
              icon={<FolderKanban size={22} />}
            />
            <StatCard
              title="Completed"
              value={stats.completed_projects || 0}
              icon={<CheckCircle2 size={22} />}
            />
            <StatCard
              title="Canceled"
              value={stats.canceled_projects || 0}
              icon={<Ban size={22} />}
            />
          </div>

        </>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Spending"
              value={formatMoney(stats.spending)}
              icon={<DollarSign size={22} />}
            />
            <StatCard
              title="Active Projects"
              value={stats.active_projects}
              icon={<FolderKanban size={22} />}
            />
            <StatCard
              title="Completed"
              value={stats.completed_projects || 0}
              icon={<CheckCircle2 size={22} />}
            />
            <StatCard
              title="Canceled"
              value={stats.canceled_projects || 0}
              icon={<Ban size={22} />}
            />
          </div>

        </>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-2xl font-semibold">Upcoming Deadlines</h3>

          <div className="mt-6 space-y-4">
            {upcoming_deadlines.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400">
                No upcoming deadlines.
              </p>
            ) : (
              upcoming_deadlines.map((project: any) => (
                <div
                  key={project.id}
                  className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/60"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-xl font-semibold"
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
                      to={
                        role === "client"
                          ? `/client-projects/${project.id}`
                          : `/projects/${project.id}`
                      }
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
            {recent_projects.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400">
                No recent projects.
              </p>
            ) : (
              recent_projects.map((project: any) => (
                <div
                  key={project.id}
                  className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/60"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-xl font-semibold"
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

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                      {role === "freelancer"
                        ? project.client?.name || "Client"
                        : project.user?.name || "Freelancer"}
                    </p>

                    <Link
                      to={
                        role === "client"
                          ? `/client-projects/${project.id}`
                          : `/projects/${project.id}`
                      }
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