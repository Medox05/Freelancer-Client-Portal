import api from "../lib/axios";

export type AppNotification = {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  project_id?: number | null;
  milestone_id?: number | null;
  conversation_id?: number | null;
  created_at: string;
  updated_at: string;
};

export async function getNotifications() {
  const { data } = await api.get<AppNotification[]>("/notifications");
  return data;
}

export async function markNotificationRead(notificationId: number) {
  const { data } = await api.post(`/notifications/${notificationId}/read`);
  return data;
}

export async function markAllNotificationsRead() {
  const { data } = await api.post("/notifications/read-all");
  return data;
}

export async function deleteNotification(notificationId: number) {
  const { data } = await api.delete(`/notifications/${notificationId}`);
  return data;
}

export async function deleteAllNotifications() {
  const { data } = await api.delete("/notifications");
  return data;
}