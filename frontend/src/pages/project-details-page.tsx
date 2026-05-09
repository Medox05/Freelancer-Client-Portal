import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  FolderKanban,
  FolderOpen,
  ListChecks,
  User,
} from "lucide-react";

import { getProjectById } from "../services/project-service";
import ProjectMilestonesManager from "../components/projects/project-milestones-manager";
import ProjectFilesManager from "../components/projects/project-files-manager";

function formatDeadline(dateString?: string | null) {
  if (!dateString) return "-";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("fr-CA");
}

function formatCreatedAt(dateString?: string | null) {
  if (!dateString) return "-";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isProjectExpired(dueDate?: string | null, status?: string) {
  if (!dueDate || status === "completed" || status === "canceled") return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  return due < today;
}

function getStatusClasses(status?: string) {
  switch (status) {
    case "pending":
      return "border border-orange-200 bg-orange-50 text-orange-600";
    case "in_progress":
      return "border border-blue-200 bg-blue-50 text-blue-600";
    case "completed":
      return "border border-green-200 bg-green-50 text-green-600";
    case "canceled":
      return "border border-red-200 bg-red-50 text-red-600";
    default:
      return "border border-slate-200 bg-slate-50 text-slate-600";
  }
}

type SectionTab = "overview" | "files" | "milestones";

export default function ProjectDetailsPage() {
  const params = useParams();
  const projectId = Number(params.id);
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<SectionTab>("overview");

  const {
    data: project,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProjectById(projectId),
    enabled: Number.isFinite(projectId) && projectId > 0,
  });

  const progress = useMemo(() => {
    if (!project?.status) return 0;

    switch (project.status) {
      case "pending":
        return 25;
      case "in_progress":
        return 65;
      case "completed":
        return 100;
      case "canceled":
        return 0;
      default:
        return 0;
    }
  }, [project?.status]);

  if (!Number.isFinite(projectId) || projectId <= 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        Invalid project id.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        Loading project details...
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        Failed to load project details.
      </div>
    );
  }



  const description = project.description || "No description provided.";
  const isLongDescription = description.length > 140;

  const tabClass = (tab: SectionTab) =>
    `inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition ${
      activeTab === tab
        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
        : "border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
    }`;

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={16} />
          Back to projects
        </Link>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 dark:border-slate-800 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {project.title}
            </h1>

            <div className="mt-3 max-w-full overflow-hidden">
              <p
                className={`max-w-full text-slate-600 dark:text-slate-400 ${
                  expanded
                    ? "whitespace-pre-wrap break-all"
                    : "max-h-[48px] overflow-hidden break-all"
                }`}
              >
                {description}
              </p>

              {isLongDescription && (
                <button
                  type="button"
                  onClick={() => setExpanded((prev) => !prev)}
                  className="mt-2 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  {expanded ? "Show less" : "Show more"}
                </button>
              )}
            </div>
          </div>

          <span
            className={`inline-flex w-fit rounded-full px-4 py-2 text-sm font-medium ${getStatusClasses(
              project.status
            )}`}
          >
            {project.status}
          </span>
        </div>

        <div className=" mt-6 flex flex-wrap gap-3 border-b border-slate-200 pb-6 dark:border-slate-800">
          <button 
            type="button"
            onClick={() => setActiveTab("overview")}
            className={tabClass("overview")}
          >
            <FolderKanban size={16} />
            Overview
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("files")}
            className={tabClass("files")}
          >
            <FolderOpen size={16} />
            Files
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("milestones")}
            className={tabClass("milestones")}
          >
            <ListChecks size={16} />
            Milestones
          </button>
        </div>

        {activeTab === "overview" && (
          <div className="mt-6">
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                <div className="mb-3 flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <User size={18} />
                  <span className="text-sm font-medium">Client</span>
                </div>
                <p className="text-base font-semibold text-slate-900 dark:text-white">
                  {project.client?.name ?? "-"}
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 break-all">
                  {project.client?.email ?? "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                <div className="mb-3 flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <CircleDollarSign size={18} />
                  <span className="text-sm font-medium">Budget</span>
                </div>
                <p className="text-base font-semibold text-slate-900 dark:text-white">
                  ${project.budget ? Number(project.budget).toFixed(2) : "0.00"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                <div className="mb-3 flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <CalendarDays size={18} />
                  <span className="text-sm font-medium">Deadline</span>
                </div>
                <p className="text-base font-semibold text-slate-900 dark:text-white">
                  {formatDeadline(project.due_date)}
                </p>
                {isProjectExpired(project.due_date, project.status) && (
                  <p className="mt-1 text-sm font-medium text-red-600 dark:text-red-400">
                    Expired
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                <div className="mb-3 flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <FolderKanban size={18} />
                  <span className="text-sm font-medium">Created at</span>
                </div>
                <p className="text-base font-semibold text-slate-900 dark:text-white">
                  {formatCreatedAt(project.created_at)}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Progress
                </h2>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {progress}%
                </span>
              </div>

              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-slate-900 transition-all dark:bg-white"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "files" && (
          <div className="mt-6 rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
            <ProjectFilesManager projectId={project.id} />
          </div>
        )}

        {activeTab === "milestones" && (
          <div className="mt-6 rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
            <ProjectMilestonesManager projectId={project.id} />
          </div>
        )}
      </div>
    </div>
  );
}