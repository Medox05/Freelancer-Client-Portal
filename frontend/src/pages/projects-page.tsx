import { useMemo, useState } from "react";
import Select from "react-select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DollarSign, Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import DatePicker from "../components/ui/date-picker";
import Modal from "../components/ui/modal";
import { useTheme } from "../lib/theme";
import { getClients } from "../services/client-service";
import {
  createProject,
  deleteProject,
  getProjects,
  updateProject,
} from "../services/project-service";
import type { Project, ProjectFormPayload, ProjectStatus } from "../types";

type ClientItem = {
  id: number;
  name: string;
  email: string;
};

type FormState = {
  client_id: string;
  title: string;
  description: string;
  budget: string;
  status: ProjectStatus;
  due_date: Date | null;
};

type SelectOption = {
  value: string;
  label: string;
};

const initialForm: FormState = {
  client_id: "",
  title: "",
  description: "",
  budget: "",
  status: "pending",
  due_date: null,
};

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

function getStatusClasses(status: ProjectStatus) {
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

function formatStatus(status: ProjectStatus) {
  if (status === "in_progress") return "In progress";
  if (status === "completed") return "Completed";
  if (status === "pending") return "Pending";
  if (status === "canceled") return "Canceled";
  return status;
}

function buildSelectStyles(isDark: boolean) {
  return {
    control: (base: any, state: any) => ({
      ...base,
      minHeight: 52,
      borderRadius: 16,
      borderColor: state.isFocused
        ? isDark
          ? "#64748b"
          : "#334155"
        : isDark
        ? "#334155"
        : "#cbd5e1",
      backgroundColor: isDark ? "#1e293b" : "#f8fafc",
      boxShadow: "none",
      cursor: "pointer",
      transition: "all 0.2s ease",
      "&:hover": {
        borderColor: isDark ? "#64748b" : "#94a3b8",
      },
    }),

    valueContainer: (base: any) => ({
      ...base,
      paddingLeft: 10,
      paddingRight: 10,
    }),

    placeholder: (base: any) => ({
      ...base,
      color: isDark ? "#94a3b8" : "#64748b",
    }),

    singleValue: (base: any) => ({
      ...base,
      color: isDark ? "#ffffff" : "#0f172a",
    }),

    input: (base: any) => ({
      ...base,
      color: isDark ? "#ffffff" : "#0f172a",
    }),

    menu: (base: any) => ({
      ...base,
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: isDark ? "#0f172a" : "#ffffff",
      border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
      boxShadow: isDark
        ? "0 10px 30px rgba(0,0,0,0.35)"
        : "0 10px 30px rgba(15,23,42,0.08)",
      zIndex: 50,
    }),

    menuList: (base: any) => ({
      ...base,
      paddingTop: 6,
      paddingBottom: 6,
      backgroundColor: isDark ? "#0f172a" : "#ffffff",
    }),

    option: (base: any, state: any) => ({
      ...base,
      cursor: "pointer",
      paddingTop: 12,
      paddingBottom: 12,
      backgroundColor: state.isSelected
        ? isDark
          ? "#334155"
          : "#0f172a"
        : state.isFocused
        ? isDark
          ? "#1e293b"
          : "#f1f5f9"
        : isDark
        ? "#0f172a"
        : "#ffffff",
      color: state.isSelected
        ? "#ffffff"
        : isDark
        ? "#ffffff"
        : "#0f172a",
      ":active": {
        backgroundColor: state.isSelected
          ? isDark
            ? "#334155"
            : "#0f172a"
          : isDark
          ? "#1e293b"
          : "#e2e8f0",
      },
    }),

    noOptionsMessage: (base: any) => ({
      ...base,
      color: isDark ? "#94a3b8" : "#64748b",
      backgroundColor: isDark ? "#0f172a" : "#ffffff",
    }),

    loadingMessage: (base: any) => ({
      ...base,
      color: isDark ? "#94a3b8" : "#64748b",
      backgroundColor: isDark ? "#0f172a" : "#ffffff",
    }),

    indicatorSeparator: () => ({
      display: "none",
    }),

    dropdownIndicator: (base: any, state: any) => ({
      ...base,
      color: state.isFocused
        ? isDark
          ? "#e2e8f0"
          : "#334155"
        : isDark
        ? "#94a3b8"
        : "#64748b",
      cursor: "pointer",
      "&:hover": {
        color: isDark ? "#ffffff" : "#0f172a",
      },
    }),

    clearIndicator: (base: any) => ({
      ...base,
      color: isDark ? "#94a3b8" : "#64748b",
      cursor: "pointer",
      "&:hover": {
        color: isDark ? "#ffffff" : "#0f172a",
      },
    }),
  };
}

function buildSelectTheme(isDark: boolean) {
  return (selectTheme: any) => ({
    ...selectTheme,
    borderRadius: 16,
    colors: {
      ...selectTheme.colors,
      primary: isDark ? "#64748b" : "#0f172a",
      primary25: isDark ? "#1e293b" : "#f1f5f9",
      primary50: isDark ? "#334155" : "#e2e8f0",
      neutral0: isDark ? "#1e293b" : "#f8fafc",
      neutral5: isDark ? "#1e293b" : "#f8fafc",
      neutral10: isDark ? "#334155" : "#e2e8f0",
      neutral20: isDark ? "#334155" : "#cbd5e1",
      neutral30: isDark ? "#64748b" : "#94a3b8",
      neutral40: isDark ? "#94a3b8" : "#64748b",
      neutral50: isDark ? "#94a3b8" : "#64748b",
      neutral60: isDark ? "#cbd5e1" : "#475569",
      neutral80: isDark ? "#ffffff" : "#0f172a",
    },
  });
}

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const { theme } = useTheme();

  function getStoredUser() {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  const currentUser = getStoredUser();

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const isDark = theme === "dark";
  const selectStyles = buildSelectStyles(isDark);
  const selectTheme = buildSelectTheme(isDark);

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: getProjects,
  });

  const { data: clients = [] } = useQuery<ClientItem[]>({
    queryKey: ["clients"],
    queryFn: getClients,
  });

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      closeForm();
      toast.success("Project created successfully.");
    },
    onError: (error: any) => {
      toast.error("Failed to create project.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ProjectFormPayload }) =>
      updateProject(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      closeForm();
      toast.success("Project updated successfully.");
    },
    onError: (error: any) => {
      toast.error("Failed to update project.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted successfully.");
    },
    onError: (error: any) => {
      toast.error("Failed to delete project.");
    },
  });

  const filteredProjects = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return projects;

    return projects.filter((project) => {
      return (
        project.title.toLowerCase().includes(keyword) ||
        (project.client?.name ?? "").toLowerCase().includes(keyword) ||
        project.status.toLowerCase().includes(keyword)
      );
    });
  }, [projects, search]);

  const clientOptions: SelectOption[] = clients.map((client) => ({
    value: String(client.id),
    label: client.name,
  }));

  const statusOptions: SelectOption[] = [
    { value: "pending", label: "Pending" },
    { value: "in_progress", label: "In progress" },
    { value: "completed", label: "Completed" },
    { value: "canceled", label: "Canceled" },
  ];

  const selectedClientOption =
    clientOptions.find((option) => option.value === form.client_id) ?? null;

  const selectedStatusOption =
    statusOptions.find((option) => option.value === form.status) ?? null;

  function openCreateForm() {
    setEditingProject(null);
    setForm(initialForm);
    setShowForm(true);
  }

  function openEditForm(project: Project) {
    setEditingProject(project);
    setForm({
      client_id: String(project.client_id),
      title: project.title,
      description: project.description ?? "",
      budget: project.budget != null ? String(project.budget) : "",
      status: project.status,
      due_date: project.due_date ? new Date(project.due_date) : null,
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingProject(null);
    setForm(initialForm);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!form.client_id) {
      toast.error("Client is required.");
      return;
    }

    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }

    if (!form.budget || Number(form.budget) < 0) {
      toast.error("Budget is required.");
      return;
    }

    if (!form.due_date) {
      toast.error("Deadline is required.");
      return;
    }

    const payload: ProjectFormPayload = {
      client_id: Number(form.client_id),
      title: form.title.trim(),
      description: form.description.trim(),
      budget: Number(form.budget),
      status: form.status,
      due_date: form.due_date.toISOString().split("T")[0],
    };

    if (editingProject) {
      updateMutation.mutate({
        id: editingProject.id,
        payload,
      });
    } else {
      createMutation.mutate(payload);
    }
  }

  function openDeleteModal(project: Project) {
    setProjectToDelete(project);
    setIsDeleteModalOpen(true);
  }

  function closeDeleteModal() {
    setProjectToDelete(null);
    setIsDeleteModalOpen(false);
  }

  function confirmDeleteProject() {
    if (!projectToDelete) return;

    deleteMutation.mutate(projectToDelete.id, {
      onSuccess: () => {
        closeDeleteModal();
      },
    });
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Project List
        </h1>

        {currentUser?.role === "freelancer" && (
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900"
          >
            <Plus size={18} />
            New Project
          </button>
        )}
      </div>

      {showForm && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {editingProject ? "Edit Project" : "Create Project"}
            </h2>

            <button
              type="button"
              onClick={closeForm}
              className="cursor-pointer rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Close
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Client
              </label>
              <Select
                options={clientOptions}
                value={selectedClientOption}
                onChange={(option) =>
                  setForm((prev) => ({
                    ...prev,
                    client_id: option ? option.value : "",
                  }))
                }
                placeholder="Select client..."
                isSearchable
                isClearable
                styles={selectStyles}
                theme={selectTheme}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Title
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Project title"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Project description"
                rows={4}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Budget
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={form.budget}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, budget: e.target.value }))
                  }
                  placeholder="0.00"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Status
                </label>
                <Select
                  options={statusOptions}
                  value={selectedStatusOption}
                  onChange={(option) =>
                    setForm((prev) => ({
                      ...prev,
                      status: (option?.value as ProjectStatus) || "pending",
                    }))
                  }
                  placeholder="Select status..."
                  isSearchable={false}
                  styles={selectStyles}
                  theme={selectTheme}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Deadline date
              </label>
              <DatePicker
                value={form.due_date}
                onChange={(date) =>
                  setForm((prev) => ({ ...prev, due_date: date }))
                }
                placeholder="Select deadline date"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full cursor-pointer rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900"
            >
              {isSaving
                ? "Saving..."
                : editingProject
                ? "Update Project"
                : "Create Project"}
            </button>
          </form>
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 p-6 dark:border-slate-800">
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 py-4 pl-12 pr-4 text-slate-900 outline-none transition hover:border-slate-400 focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:border-slate-500"
            />
          </div>
        </div>

        <div className="w-full">
          <table className="w-full table-fixed">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr className="text-left">
                <th className="w-[16%] px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Title
                </th>
                <th className="w-[12%] px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Client
                </th>
                <th className="w-[10%] px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Budget
                </th>
                <th className="w-[12%] px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Status
                </th>
                <th className="w-[12%] px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Deadline
                </th>
                <th className="w-[12%] px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Created
                </th>
                <th className="w-[26%] px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-slate-500 dark:text-slate-400"
                  >
                    Loading projects...
                  </td>
                </tr>
              ) : filteredProjects.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-slate-500 dark:text-slate-400"
                  >
                    No projects found.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project) => (
                  <tr
                    key={project.id}
                    className="border-t border-slate-200 dark:border-slate-800"
                  >
                    <td className="px-4 py-4 font-semibold text-slate-900 dark:text-white">
                      <div className="truncate">{project.title}</div>
                    </td>

                    <td className="px-4 py-4 text-slate-700 dark:text-slate-300">
                      <div className="truncate">{project.client?.name ?? "-"}</div>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                      <div className="inline-flex items-center gap-2">
                        <DollarSign size={16} />
                        {project.budget ? Number(project.budget).toFixed(2) : "0.00"}
                      </div>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium ${getStatusClasses(
                          project.status
                        )}`}
                      >
                        {formatStatus(project.status)}
                      </span>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-slate-700 dark:text-slate-300">
                      <div className="flex flex-col">
                        <span>{formatDeadline(project.due_date)}</span>
                        {isProjectExpired(project.due_date, project.status) && (
                          <span className="text-xs font-medium text-red-600 dark:text-red-400">
                            Expired
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-slate-700 dark:text-slate-300">
                      {formatCreatedAt(project.created_at)}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex flex-nowrap items-center gap-2">
                        <Link
                          to={`/projects/${project.id}`}
                          className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <Eye size={16} />
                          View
                        </Link>

                        {currentUser && currentUser.id === project.user?.id && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditForm(project)}
                              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-blue-500 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                            >
                              <Pencil size={16} />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => openDeleteModal(project)}
                              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-red-500 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            >
                              <Trash2 size={16} />
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={isDeleteModalOpen} onClose={closeDeleteModal}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Confirm Delete
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              You are about to delete this project.
            </p>
          </div>
        </div>

        {projectToDelete && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
            <div className="text-lg font-medium text-slate-900 dark:text-white">
              {projectToDelete.title}
            </div>

            <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {projectToDelete.client?.name ?? "-"}
            </div>

            <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              $
              {projectToDelete.budget
                ? Number(projectToDelete.budget).toFixed(2)
                : "0.00"}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={closeDeleteModal}
            className="cursor-pointer rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={confirmDeleteProject}
            className="cursor-pointer rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Yes, delete
          </button>
        </div>
      </Modal>
    </div>
  );
}