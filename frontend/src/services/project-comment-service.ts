import api from "../lib/axios";

export type ProjectComment = {
  id: number;
  project_id: number;
  user_id: number;
  message: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: "freelancer" | "client";
  };
};

export async function getProjectComments(projectId: number) {
  const { data } = await api.get<ProjectComment[]>(
    `/projects/${projectId}/comments`
  );
  return data;
}

export async function createProjectComment(
  projectId: number,
  message: string
) {
  const { data } = await api.post<ProjectComment>(
    `/projects/${projectId}/comments`,
    { message }
  );
  return data;
}

export async function deleteProjectComment(commentId: number) {
  const { data } = await api.delete(`/project-comments/${commentId}`);
  return data;
}