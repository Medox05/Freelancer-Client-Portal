import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import Modal from "../ui/modal";
import api from "../../lib/axios";

type ProjectFile = {
  id: number;
  file_name: string;
  file_size: number;
  created_at: string;
  download_url: string;
};

type Props = {
  projectId: number;
};

async function getProjectFiles(projectId: number): Promise<ProjectFile[]> {
  const { data } = await api.get(`/projects/${projectId}/files`);
  return data;
}

async function uploadProjectFile(projectId: number, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post(`/projects/${projectId}/files`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
}

async function deleteProjectFile(fileId: number) {
  const { data } = await api.delete(`/project-files/${fileId}`);
  return data;
}

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

function formatDate(date?: string) {
  if (!date) return "-";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "-";

  return parsed.toLocaleDateString("fr-CA");
}

export default function ProjectFilesManager({ projectId }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();

  const [fileToDelete, setFileToDelete] = useState<ProjectFile | null>(null);

  const { data: files = [], isLoading } = useQuery({
    queryKey: ["project-files", projectId],
    queryFn: () => getProjectFiles(projectId),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadProjectFile(projectId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-files", projectId] });
      toast.success("File uploaded successfully.");
    },
    onError: () => {
      toast.error("Failed to upload file.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProjectFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-files", projectId] });
      setFileToDelete(null);
      toast.success("File deleted successfully.");
    },
    onError: () => {
      toast.error("Failed to delete file.");
    },
  });

  function confirmDelete() {
    if (!fileToDelete) return;
    deleteMutation.mutate(fileToDelete.id);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
            Files
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Upload and manage your project files
          </p>
        </div>

        <div>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              uploadMutation.mutate(file);
              e.currentTarget.value = "";
            }}
          />

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploadMutation.isPending}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            <Upload size={16} />
            {uploadMutation.isPending ? "Uploading..." : "Upload File"}
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-slate-500 dark:text-slate-400">Loading files...</p>
      ) : files.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No files uploaded yet.
        </div>
      ) : (
        <div className="space-y-3">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-slate-900 dark:text-white">
                  {file.file_name}
                </p>

                <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
                  <span>{formatFileSize(file.file_size)}</span>
                  <span>{formatDate(file.created_at)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={file.download_url}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Download size={16} />
                  Download
                </a>

                <button
                  type="button"
                  onClick={() => setFileToDelete(file)}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-500 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/10"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!fileToDelete} onClose={() => setFileToDelete(null)}>
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Confirm Delete
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            You are about to delete this file.
          </p>
        </div>

        {fileToDelete && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
            <div className="text-lg font-medium text-slate-900 dark:text-white">
              {fileToDelete.file_name}
            </div>
            <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {formatFileSize(fileToDelete.file_size)}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setFileToDelete(null)}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={confirmDelete}
            disabled={deleteMutation.isPending}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {deleteMutation.isPending ? "Deleting..." : "Yes, delete"}
          </button>
        </div>
      </Modal>
    </div>
  );
}