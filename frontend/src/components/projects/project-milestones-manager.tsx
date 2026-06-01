import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Modal from "../ui/modal";
import api from "../../lib/axios";
import DatePicker from "../ui/date-picker";
import Select from "react-select";
import { useTheme } from "../../lib/theme";

type Milestone = {
  id: number;
  project_id: number;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed" | "canceled";
  due_date: string | null;
};

type Props = {
  projectId: number;
};

type FormState = {
  title: string;
  description: string;
  status: Milestone["status"];
  due_date: string;
};

const initialForm: FormState = {
  title: "",
  description: "",
  status: "pending",
  due_date: "",
};

async function getMilestones(projectId: number): Promise<Milestone[]> {
  const { data } = await api.get(`/projects/${projectId}/milestones`);
  return data;
}

async function createMilestone(projectId: number, payload: FormState) {
  const { data } = await api.post(`/projects/${projectId}/milestones`, {
    title: payload.title,
    description: payload.description || null,
    status: payload.status,
    due_date: payload.due_date || null,
  });
  return data;
}

async function updateMilestone(id: number, payload: FormState) {
  const { data } = await api.put(`/milestones/${id}`, {
    title: payload.title,
    description: payload.description || null,
    status: payload.status,
    due_date: payload.due_date || null,
  });
  return data;
}

async function deleteMilestone(id: number) {
  const { data } = await api.delete(`/milestones/${id}`);
  return data;
}

function formatDateOnly(date?: string | null) {
  if (!date) return "-";
  return date.split("T")[0];
}

function getStatusClass(status: Milestone["status"]) {
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
      backgroundColor: isDark ? "#1e293b" : "#ffffff",
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
      neutral0: isDark ? "#1e293b" : "#ffffff",
      neutral5: isDark ? "#1e293b" : "#ffffff",
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

export default function ProjectMilestonesManager({ projectId }: Props) {
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const selectStyles = buildSelectStyles(isDark);
  const selectTheme = buildSelectTheme(isDark);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [milestoneToDelete, setMilestoneToDelete] = useState<Milestone | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);

  const { data: milestones = [], isLoading } = useQuery({
    queryKey: ["project-milestones", projectId],
    queryFn: () => getMilestones(projectId),
  });

  const createMutation = useMutation({
    mutationFn: (payload: FormState) => createMilestone(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-milestones", projectId] });
      closeModal();
      toast.success("Milestone created successfully.");
    },
    onError: () => toast.error("Failed to create milestone."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: FormState }) =>
      updateMilestone(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-milestones", projectId] });
      closeModal();
      toast.success("Milestone updated successfully.");
    },
    onError: () => toast.error("Failed to update milestone."),
  });

  function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

  const deleteMutation = useMutation({
    mutationFn: deleteMilestone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-milestones", projectId] });
      setMilestoneToDelete(null);
      toast.success("Milestone deleted successfully.");
    },
    onError: () => toast.error("Failed to delete milestone."),
  });

  function openCreateModal() {
    setEditingMilestone(null);
    setForm(initialForm);
    setIsModalOpen(true);
  }

  function openEditModal(milestone: Milestone) {
    setEditingMilestone(milestone);
    setForm({
      title: milestone.title,
      description: milestone.description || "",
      status: milestone.status,
      due_date: milestone.due_date ? milestone.due_date.split("T")[0] : "",
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingMilestone(null);
    setForm(initialForm);
  }

  function submitForm(e: React.FormEvent) {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }

    if (editingMilestone) {
      updateMutation.mutate({
        id: editingMilestone.id,
        payload: form,
      });
    } else {
      createMutation.mutate(form);
    }
  }

  function parseDate(value?: string) {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
            Milestones
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Create and manage project milestones
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          <Plus size={16} />
          Add Milestone
        </button>
      </div>

      {isLoading ? (
        <p className="text-slate-500 dark:text-slate-400">Loading milestones...</p>
      ) : milestones.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No milestones yet.
        </div>
      ) : (
        <div className="space-y-4">
          {milestones.map((milestone) => (
            <div
              key={milestone.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">
                      {milestone.title}
                    </p>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                        milestone.status
                      )}`}
                    >
                      {milestone.status}
                    </span>
                  </div>

                  <p className="mt-2 break-words text-slate-500 dark:text-slate-400">
                    {milestone.description || "No description"}
                  </p>

                  <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                    Due: {formatDateOnly(milestone.due_date)}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(milestone)}
                    className="rounded-xl border border-blue-500 px-3 py-2 text-blue-600 transition hover:bg-blue-50 dark:border-blue-500/40 dark:text-blue-300 dark:hover:bg-blue-500/10"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setMilestoneToDelete(milestone)}
                    className="rounded-xl border border-red-500 px-3 py-2 text-red-600 transition hover:bg-red-50 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/10"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={isModalOpen} onClose={closeModal}>
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            {editingMilestone ? "Edit Milestone" : "Add Milestone"}
          </h2>
        </div>

        <form onSubmit={submitForm} className="mt-6 space-y-4">
  <input
    type="text"
    value={form.title}
    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
    placeholder="Milestone title"
    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-slate-500"
  />

  <textarea
    value={form.description}
    onChange={(e) =>
      setForm((prev) => ({ ...prev, description: e.target.value }))
    }
    placeholder="Description"
    rows={4}
    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-slate-500"
  />

  <div className="grid gap-4 md:grid-cols-2">
    <Select
      options={[
        { value: "pending", label: "Pending" },
        { value: "in_progress", label: "In progress" },
        { value: "completed", label: "Completed" },
        { value: "canceled", label: "Canceled" },
      ]}
      value={{
        value: form.status,
        label:
          form.status === "in_progress"
            ? "In progress"
            : form.status.charAt(0).toUpperCase() + form.status.slice(1),
      }}
      onChange={(option) =>
        setForm((prev) => ({
          ...prev,
          status: (option?.value as Milestone["status"]) || "pending",
        }))
      }
      isSearchable={false}
      styles={selectStyles}
      theme={selectTheme}
    />

    <DatePicker
      value={parseDate(form.due_date)}
      onChange={(date) =>
        setForm((prev) => ({
          ...prev,
          due_date: date ? formatLocalDate(date) : "",
        }))
      }
      placeholder="Select deadline date"
      placement="top"
    />
  </div>

  <button
    type="submit"
    disabled={createMutation.isPending || updateMutation.isPending}
    className="cursor-pointer w-full rounded-2xl bg-slate-900 px-4 py-3 text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
  >
    {editingMilestone ? "Update Milestone" : "Create Milestone"}
  </button>
</form>
      </Modal>

      <Modal open={!!milestoneToDelete} onClose={() => setMilestoneToDelete(null)}>
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
          Confirm Delete
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          You are about to delete this milestone.
        </p>

        {milestoneToDelete && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
            <div className="text-lg font-medium text-slate-900 dark:text-white">
              {milestoneToDelete.title}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setMilestoneToDelete(null)}
            className="rounded-xl border border-slate-300 px-4 py-2 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => milestoneToDelete && deleteMutation.mutate(milestoneToDelete.id)}
            className="rounded-xl bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
          >
            Yes, delete
          </button>
        </div>
      </Modal>
    </div>
  );
}