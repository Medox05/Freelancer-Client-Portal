import api from "../lib/axios";

export type MeetingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export type Meeting = {
  id: number;
  freelancer_id: number;
  client_id: number;
  created_by: number;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  status: MeetingStatus;
  freelancer: { id: number; name: string; email: string };
  client: { id: number; name: string; email: string };
};

export async function getMeetings() {
  const { data } = await api.get<Meeting[]>("/meetings");
  return data;
}

export async function createMeeting(payload: {
  other_user_id: number;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
}) {
  const { data } = await api.post<Meeting>("/meetings", payload);
  return data;
}

export async function updateMeetingStatus(id: number, status: MeetingStatus) {
  const { data } = await api.put<Meeting>(`/meetings/${id}/status`, { status });
  return data;
}

export async function deleteMeeting(id: number) {
  await api.delete(`/meetings/${id}`);
}
