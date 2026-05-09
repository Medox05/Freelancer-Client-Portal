import api from "../lib/axios";

export async function getMilestoneFiles(milestoneId: number) {
  const { data } = await api.get(`/milestones/${milestoneId}/files`);
  return data;
}

export async function uploadMilestoneFile(
  milestoneId: number,
  file: File
) {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post(`/milestones/${milestoneId}/files`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
}

export async function downloadMilestoneFile(
  fileId: number,
  fileName: string
) {
  const response = await api.get(`/milestone-files/${fileId}/download`, {
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

export async function deleteMilestoneFile(fileId: number) {
  const { data } = await api.delete(`/milestone-files/${fileId}`);
  return data;
}