import api from "../lib/axios";

export type MilestoneStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "canceled";

export async function getMilestones(projectId: number) {
  const { data } = await api.get(`/projects/${projectId}/milestones`);
  return data;
}

export async function createMilestone(
  projectId: number,
  payload: {
    title: string;
    description: string;
    status: MilestoneStatus;
    due_date: string | null;
  }
) {
  const { data } = await api.post(`/projects/${projectId}/milestones`, payload);
  return data;
}

export async function updateMilestone(
  milestoneId: number,
  payload: {
    title: string;
    description: string;
    status: MilestoneStatus;
    due_date: string | null;
  }
) {
  const { data } = await api.put(`/milestones/${milestoneId}`, payload);
  return data;
}

export async function deleteMilestone(milestoneId: number) {
  const { data } = await api.delete(`/milestones/${milestoneId}`);
  return data;
}