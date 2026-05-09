import api from "../lib/axios";

export async function getClients() {
  const { data } = await api.get("/clients");
  return data;
}

export async function createClient(payload: {
  name: string;
  email: string;
  company?: string;
  phone?: string;
}) {
  const { data } = await api.post("/clients", payload);
  return data;
}

export async function updateClient(
  id: number,
  payload: {
    name: string;
    email: string;
    company?: string;
    phone?: string;
  }
) {
  const { data } = await api.put(`/clients/${id}`, payload);
  return data;
}

export async function deleteClient(id: number) {
  const { data } = await api.delete(`/clients/${id}`);
  return data;
}

export async function resendInvitation(id: number) {
  const { data } = await api.post(`/clients/${id}/resend-invitation`);
  return data;
}