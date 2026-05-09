import api from "../lib/axios";

export type ProjectFile = {
  id: number;
  project_id: number;
  uploaded_by: number;
  file_name: string;
  original_name: string;
  file_path: string;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
};

export async function getProjectFiles(projectId: number) {
  const { data } = await api.get<ProjectFile[]>(`/projects/${projectId}/files`);
  return data;
}

export async function uploadProjectFile(projectId: number, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post(`/projects/${projectId}/files`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
}

export async function downloadProjectFile(fileId: number, fileName: string) {
  const response = await api.get(`/project-files/${fileId}/download`, {
    responseType: "blob",
  });

  const blob = new Blob([response.data]);
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
}

export async function deleteProjectFile(fileId: number) {
  const { data } = await api.delete(`/project-files/${fileId}`);
  return data;
}