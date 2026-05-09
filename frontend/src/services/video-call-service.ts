import api from "../lib/axios";

export interface User {
  id: number;
  name: string;
  email: string;
  last_seen_at?: string;
  invitation_accepted_at?: string | null;
}

export interface VideoCall {
  id: number;
  caller_id: number;
  callee_id: number;
  status: 'ringing' | 'accepted' | 'rejected' | 'ended';
  started_at?: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
  caller?: User;
  callee?: User;
}

export async function getAvailableUsers() {
  try {
    const { data } = await api.get<User[]>("/video-calls/available-users");
    return data || [];
  } catch (error: any) {
    throw error;
  }
}

export async function initiateCall(calleeId: number) {
  try {
    const { data } = await api.post<VideoCall>("/video-calls/initiate", {
      callee_id: calleeId,
    });
    return data;
  } catch (error: any) {
    throw error;
  }
}

export async function acceptCall(videoCallId: number) {
  try {
    const { data } = await api.post<VideoCall>(
      `/video-calls/${videoCallId}/accept`,
      {}
    );
    return data;
  } catch (error: any) {
    throw error;
  }
}

export async function rejectCall(videoCallId: number) {
  try {
    const { data } = await api.post<VideoCall>(
      `/video-calls/${videoCallId}/reject`,
      {}
    );
    return data;
  } catch (error: any) {
    throw error;
  }
}

export async function endCall(videoCallId: number) {
  try {
    const { data } = await api.post<VideoCall>(
      `/video-calls/${videoCallId}/end`,
      {}
    );
    return data;
  } catch (error: any) {
    throw error;
  }
}

export async function getActiveCall() {
  try {
    const { data } = await api.get<VideoCall | null>("/video-calls/active");
    return data;
  } catch (error: any) {
    throw error;
  }
}

export async function getIncomingCalls() {
  try {
    const { data } = await api.get<VideoCall[]>("/video-calls/incoming");
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    throw error;
  }
}

export async function getCallHistory() {
  try {
    const { data } = await api.get<VideoCall[]>("/video-calls/history");
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    throw error;
  }
}

export async function deleteCallRecord(videoCallId: number) {
  try {
    const { data } = await api.delete(`/video-calls/${videoCallId}`);
    return data;
  } catch (error: any) {
    throw error;
  }
}

export async function deleteAllCallHistory() {
  try {
    const { data } = await api.delete("/video-calls/history");
    return data;
  } catch (error: any) {
    throw error;
  }
}
