import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText, FolderOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { getProjects } from "../services/project-service";
import { downloadProjectFile } from "../services/project-file-services";

export default function ClientFilesPage() {
  const { data: projects = [], isLoading, isError } = useQuery({
    queryKey: ["client-projects-with-files"],
    queryFn: getProjects,
  });

  const files = useMemo(() => {
    return projects
      .flatMap((project: any) =>
        (project.files ?? []).map((file: any) => ({
          ...file,
          projectTitle: project.title,
          projectId: project.id,
        }))
      )
      .sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }, [projects]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Files</h2>
        <p className="text-slate-500 dark:text-slate-400">
          View and download files shared with you.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800">
          <h3 className="text-2xl font-semibold">Shared Files</h3>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-slate-500 dark:text-slate-400">
            Loading files...
          </div>
        ) : isError ? (
          <div className="p-10 text-center text-red-600 dark:text-red-300">
            Failed to load files.
          </div>
        ) : files.length === 0 ? (
          <div className="p-10 text-center text-slate-500 dark:text-slate-400">
            <FolderOpen className="mx-auto mb-3" size={28} />
            No files available yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {files.map((file: any) => (
              <div
                key={file.id}
                className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex min-w-0 items-start gap-4">
                  <div className="rounded-2xl bg-slate-100 p-3 dark:bg-slate-800">
                    <FileText size={18} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900 dark:text-white">
                      {file.original_name || file.file_name}
                    </p>

                    <Link
                      to={`/client-projects/${file.projectId}?tab=files`}
                      className="mt-1 block text-sm text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {file.projectTitle}
                    </Link>

                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      {new Date(file.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    try {
                      await downloadProjectFile(
                        file.id,
                        file.original_name || file.file_name || "file"
                      );
                      toast.success("Download started");
                    } catch (err: any) {
                      toast.error("Failed to download file");
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-600 bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-200 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
                >
                  <Download size={16} />
                  Download
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}