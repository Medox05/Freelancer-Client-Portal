import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  FolderKanban,
  ListChecks,
  User,
  Receipt,
  MessageSquare,
  Download,
  Eye,
  FileSignature,
} from "lucide-react";
import { getProjectById } from "../services/project-service";
import api from "../lib/axios";
import ProjectInvoicesManager from "../components/projects/project-invoices-manager";
import FileFeedbackViewer from "../components/projects/file-feedback-viewer";
import ProjectContractsManager from "../components/projects/project-contracts-manager";
import { handleFileDownload, handleFileOpen } from "../lib/download";

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
      return "border border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300";
    case "in_progress":
      return "border border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300";
    case "completed":
      return "border border-green-200 bg-green-50 text-green-600 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300";
    case "canceled":
      return "border border-red-200 bg-red-50 text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300";
    default:
      return "border border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
  }
}

type ProjectFile = {
  id: number;
  file_name: string;
  file_size: number;
  created_at: string;
  download_url: string;
  mime_type?: string;
  file_url?: string;
};

type Milestone = {
  id: number;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
};

async function getProjectFiles(projectId: number): Promise<ProjectFile[]> {
  const { data } = await api.get(`/projects/${projectId}/files`);
  return data;
}

async function getProjectMilestones(projectId: number): Promise<Milestone[]> {
  const { data } = await api.get(`/projects/${projectId}/milestones`);
  return data;
}

type TabType = "overview" | "files" | "milestones" | "invoices" | "contracts";

export default function ClientProjectDetailsPage() {
  const { id } = useParams();
  const projectId = Number(id);
  const [searchParams, setSearchParams] = useSearchParams();
  const queryTab = searchParams.get("tab");

  const initialTab: TabType =
    queryTab === "files" || queryTab === "milestones" || queryTab === "overview" || queryTab === "invoices" || queryTab === "contracts"
      ? (queryTab as TabType)
      : "overview";

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [expanded, setExpanded] = useState(false);
  const [selectedReviewFile, setSelectedReviewFile] = useState<ProjectFile | null>(null);

  useEffect(() => {
    if (queryTab === "files" || queryTab === "milestones" || queryTab === "overview" || queryTab === "invoices" || queryTab === "contracts") {
      setActiveTab(queryTab as TabType);
    }
  }, [queryTab]);

  function changeTab(tab: TabType) {
    setActiveTab(tab);
    setSearchParams({ tab });
  }

  const {
    data: project,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["client-project", projectId],
    queryFn: () => getProjectById(projectId),
    enabled: Number.isFinite(projectId) && projectId > 0,
  });

  const { data: files = [] } = useQuery({
    queryKey: ["client-project-files", projectId],
    queryFn: () => getProjectFiles(projectId),
    enabled: Number.isFinite(projectId) && projectId > 0,
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ["client-project-milestones", projectId],
    queryFn: () => getProjectMilestones(projectId),
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

  if (isLoading) {
    return <div className="text-slate-500 dark:text-slate-400">Loading project...</div>;
  }

  if (isError || !project) {
    return <div className="text-red-600 dark:text-red-300">Failed to load project.</div>;
  }

  const description = project.description || "No description available.";
  const isLongDescription = description.length > 140;

  const tabClass = (tab: TabType) =>
    `inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition ${
      activeTab === tab
        ? "bg-slate-950 text-white dark:bg-white dark:text-slate-900"
        : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
    }`;

  function formatFileSize(size?: number) {
    if (!size) return "0 B";

    const units = ["B", "KB", "MB", "GB"];
    let value = size;
    let i = 0;

    while (value >= 1024 && i < units.length - 1) {
      value /= 1024;
      i++;
    }

    return `${value.toFixed(1)} ${units[i]}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/client-projects"
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={16} />
          Back
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{project.title}</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">View project details, files and milestones.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={() => changeTab("overview")} className={tabClass("overview")}>
          <ClipboardList size={16} />
          Overview
        </button>

        <button onClick={() => changeTab("files")} className={tabClass("files")}>
          <FolderKanban size={16} />
          Files
        </button>

        <button onClick={() => changeTab("milestones")} className={tabClass("milestones")}>
          <ListChecks size={16} />
          Milestones
        </button>

        <button onClick={() => changeTab("invoices")} className={tabClass("invoices")}>
          <Receipt size={16} />
          Invoices
        </button>

        <button onClick={() => changeTab("contracts")} className={tabClass("contracts")}>
          <FileSignature size={16} />
          Contracts
        </button>
      </div>

      {activeTab === "overview" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Project Overview</h2>
              <p className="mt-1 text-slate-500 dark:text-slate-400">Status, deadline, budget and description.</p>
            </div>

            <span className={`inline-flex rounded-full px-4 py-2 text-sm font-medium ${getStatusClasses(project.status)}`}>
              {project.status}
            </span>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/60">
              <div className="mb-3 flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <CalendarDays size={18} />
                <span className="text-sm font-medium">Deadline</span>
              </div>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{formatDateOnly(project.due_date)}</p>
              {isProjectExpired(project.due_date, project.status) && (
                <p className="mt-1 text-sm font-medium text-red-600 dark:text-red-400">
                  Expired
                </p>
              )}
            </div>

            <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/60">
              <div className="mb-3 flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <CircleDollarSign size={18} />
                <span className="text-sm font-medium">Budget</span>
              </div>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">${project.budget ? Number(project.budget).toFixed(2) : "0.00"}</p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/60">
              <div className="mb-3 flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <User size={18} />
                <span className="text-sm font-medium">Freelancer</span>
              </div>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{project.user?.name || "-"}</p>
              <p className="mt-1 break-all text-sm text-slate-500 dark:text-slate-400">{project.user?.email || ""}</p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/60">
              <div className="mb-3 flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <FolderKanban size={18} />
                <span className="text-sm font-medium">Created at</span>
              </div>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{formatDateTime(project.created_at)}</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/60">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Description</h3>

            <p className={`mt-3 text-slate-600 dark:text-slate-400 ${expanded ? "whitespace-pre-wrap break-all" : "max-h-[48px] overflow-hidden break-all"}`}>
              {description}
            </p>

            {isLongDescription && (
              <button type="button" onClick={() => setExpanded((prev) => !prev)} className="mt-2 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
                {expanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>

          <div className="mt-5 rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/60">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Progress</h3>
              <span className="text-sm text-slate-500 dark:text-slate-400">{progress}%</span>
            </div>

            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div className="h-full rounded-full bg-slate-950 dark:bg-white" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      )}

      {activeTab === "files" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Project Files</h2>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Download files shared by the freelancer.</p>
          <p className="mt-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
            💡 Tip: Click "Feedback" on any file to open a live discussion thread and leave messages!
          </p>

          <div className="mt-6 space-y-3">
            {files.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400">No files available.</p>
            ) : (
              files.map((file) => (
                <div key={file.id} className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{file.file_name}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{formatFileSize(file.file_size)} • {formatDateOnly(file.created_at)}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedReviewFile(file)}
                      className="inline-flex items-center gap-2 rounded-xl border border-indigo-500 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-600 transition hover:bg-indigo-100 dark:border-indigo-500/40 dark:bg-indigo-950/20 dark:text-indigo-300 dark:hover:bg-indigo-950/40 cursor-pointer"
                    >
                      <MessageSquare size={16} />
                      Feedback
                    </button>

                    <button
                      type="button"
                      onClick={() => handleFileOpen(file.download_url, file.file_name)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Eye size={16} />
                      Open
                    </button>

                    <button
                      type="button"
                      onClick={() => handleFileDownload(file.download_url, file.file_name)}
                      className="inline-flex items-center gap-2 rounded-xl border border-blue-600 bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-200 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20 cursor-pointer"
                    >
                      <Download size={16} />
                      Download
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "milestones" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Milestones</h2>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Follow project steps created by the freelancer.</p>

          <div className="mt-6 space-y-4">
            {milestones.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400">No milestones yet.</p>
            ) : (
              milestones.map((milestone) => (
                <div key={milestone.id} className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/60">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">{milestone.title}</p>

                      <p className="mt-2 break-words text-slate-500 dark:text-slate-400">{milestone.description || "No description"}</p>

                      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Due: {formatDateOnly(milestone.due_date)}</p>
                    </div>

                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(milestone.status)}`}>{milestone.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "invoices" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <ProjectInvoicesManager projectId={project.id} defaultAmount={project.budget ?? undefined} />
        </div>
      )}

      {activeTab === "contracts" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <ProjectContractsManager projectId={project.id} />
        </div>
      )}
      {selectedReviewFile && (
        <FileFeedbackViewer
          file={selectedReviewFile}
          onClose={() => setSelectedReviewFile(null)}
        />
      )}
    </div>
  );
}
