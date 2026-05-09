import api from "../lib/axios";

export type DashboardResponse = {
  role: "freelancer" | "client";
  stats: {
    total_clients?: number;
    total_earnings?: number;
    active_projects: number;
    completed_projects?: number;
    canceled_projects?: number;

    spending?: number;
  };
  recent_projects: any[];
  upcoming_deadlines: any[];
};

export async function getDashboardStats(): Promise<DashboardResponse> {
  const { data } = await api.get("/dashboard/stats");
  return data;
}