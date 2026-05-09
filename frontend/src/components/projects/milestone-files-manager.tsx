import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import api from "../../lib/axios";

type ProjectFile = {
  id: number;
  project_id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
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

  const { data } = await api.post(`/projects/${projectId}/files`, formData);
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
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

export default function ProjectFilesManager({ projectId }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();

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
    onError: () => toast.error("Failed to upload file."),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProjectFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-files", projectId] });
      toast.success("File deleted successfully.");
    },
    onError: () => toast.error("Failed to delete file."),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
            Files
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Upload and manage project files
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
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            <Upload size={16} />
            Upload File
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-slate-500 dark:text-slate-400">Loading files...</p>
      ) : files.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400">No files yet.</p>
      ) : (
        <div className="space-y-3">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900 dark:text-white">
                  {file.file_name}
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {formatFileSize(file.file_size)}
                </p>
              </div>

              <div className="flex gap-2">
                <a
                  href={file.download_url}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-slate-700"
                >
                  <Download size={16} />
                </a>

                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(file.id)}
                  className="rounded-xl border border-red-500 px-3 py-2 text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}