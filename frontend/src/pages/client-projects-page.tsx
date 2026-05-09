import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, FolderKanban, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { getProjects } from "../services/project-service";

type Project = {
  id: number;
  title: string;
  description?: string | null;
  budget?: number | string | null;
  status: "pending" | "in_progress" | "completed" | "canceled";
  due_date?: string | null;
  created_at?: string | null;
  user?: {
    id: number;
    name: string;
    email?: string;
  } | null;
};

function formatDateOnly(date?: string | null) {
  if (!date) return "-";
  return date.split("T")[0];
}

function formatDateTime(date?: string | null) {
  if (!date) return "-";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "-";

  return parsed.toLocaleString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(value?: number | string | null) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function isProjectExpired(dueDate?: string | null, status?: string) {
  if (!dueDate || status === "completed" || status === "canceled") return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  return due < today;
}

function getStatusClass(status: Project["status"]) {
  if (status === "completed") {
    return "border border-green-200 bg-green-50 text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300";
  }

  if (status === "in_progress") {
    return "border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300";
  }

  if (status === "canceled") {
    return "border border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300";
  }

  return "border border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300";
}

function formatStatus(status: string) {
  if (status === "in_progress") return "In progress";
  if (status === "completed") return "Completed";
  if (status === "pending") return "Pending";
  if (status === "canceled") return "Canceled";
  return status;
}

function getProgress(status: Project["status"]) {
  if (status === "completed") return 100;
  if (status === "in_progress") return 65;
  if (status === "pending") return 25;
  return 0;
}

export default function ClientProjectsPage() {
  const [search, setSearch] = useState("");

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["client-projects-page"],
    queryFn: getProjects,
    retry: 1,
  });

  const projects: Project[] = Array.isArray(data) ? data : [];

  const filteredProjects = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return projects;

    return projects.filter((project) => {
      const title = project.title?.toLowerCase() || "";
      const status = project.status?.toLowerCase() || "";
      const freelancer = project.user?.name?.toLowerCase() || "";

      return (
        title.includes(keyword) ||
        status.includes(keyword) ||
        freelancer.includes(keyword)
      );
    });
  }, [projects, search]);

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-slate-500 dark:text-slate-400">Loading projects...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm dark:border-red-500/30 dark:bg-red-500/10">
        <h2 className="text-lg font-semibold text-red-700 dark:text-red-300">
          Failed to load projects
        </h2>
        <p className="mt-2 text-sm text-red-600 dark:text-red-300">
          {(error as Error)?.message || "Something went wrong while loading projects."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          My Projects
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Track your assigned projects, deadlines and progress.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 p-6 dark:border-slate-800">
          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 py-4 pl-12 pr-4 text-slate-900 outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
              <FolderKanban size={24} className="text-slate-500 dark:text-slate-400" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">
              No projects found
            </h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              There are no projects matching your search.
            </p>
          </div>
        ) : (
          <div className="w-full">
            <table className="w-full table-fixed">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr className="text-left">
                  <th className="w-[20%] px-4 py-4 text-sm">Title</th>
<th className="w-[12%] px-4 py-4 text-sm">Freelancer</th>
<th className="w-[10%] px-4 py-4 text-sm">Budget</th>
<th className="w-[12%] px-4 py-4 text-sm">Status</th>
<th className="w-[12%] px-4 py-4 text-sm">Deadline</th>
<th className="w-[14%] px-4 py-4 text-sm">Created</th>
<th className="w-[10%] px-4 py-4 text-sm">Progress</th>
<th className="w-[10%] px-4 py-4 text-sm">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredProjects.map((project) => (
                  <tr
                    key={project.id}
                    className="border-t border-slate-200 dark:border-slate-800"
                  >
                    <td className="px-6 py-5">
                      <div className="min-w-[180px]">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {project.title}
                        </p>
                        <p className="mt-1 truncate text-sm ">
                          {project.description || "No description available."}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-5 text-slate-700 dark:text-slate-300">
                      {project.user?.name || "-"}
                    </td>

                    <td className="px-6 py-5 text-slate-700 dark:text-slate-300">
                      {formatMoney(project.budget)}
                    </td>

                    <td className="px-6 py-5">
                      <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(project.status)}`}>
                        {formatStatus(project.status)}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-slate-700 dark:text-slate-300">
                      <div className="flex flex-col">
                        <span>{formatDateOnly(project.due_date)}</span>
                        {isProjectExpired(project.due_date, project.status) && (
                          <span className="text-xs font-medium text-red-600 dark:text-red-400">
                            Expired
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-5 text-slate-700 dark:text-slate-300">
                      {formatDateTime(project.created_at)}
                    </td>

                    <td className="px-6 py-5">
                      <div className="w-24">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{ width: `${getProgress(project.status)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <Link
                        to={`/client-projects/${project.id}`}
                        className="inline-flex items-center gap-2 rounded-xl border border-blue-600 bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-200 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
                      >
                        <Eye size={16} />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}