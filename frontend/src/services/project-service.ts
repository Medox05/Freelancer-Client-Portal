import api from "../lib/axios";
import type { Project, ProjectFormPayload } from "../types";

export async function getProjects(): Promise<Project[]> {
  const { data } = await api.get("/projects");
  return data;
}

export async function getProjectById(id: number): Promise<Project> {
  const { data } = await api.get(`/projects/${id}`);
  return data;
}

export async function createProject(
  payload: ProjectFormPayload
): Promise<Project> {
  const { data } = await api.post("/projects", payload);
  return data;
}

export async function updateProject(
  id: number,
  payload: ProjectFormPayload
): Promise<Project> {
  const { data } = await api.put(`/projects/${id}`, payload);
  return data;
}

export async function deleteProject(
  id: number
): Promise<{ message: string }> {
  const { data } = await api.delete(`/projects/${id}`);
  return data;
}