import api from "../lib/axios";

export type User = {
  id: number;
  name: string;
  email: string;
  role: "freelancer" | "client";
  last_seen_at?: string | null;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
};

type AuthResponse = {
  message?: string;
  user?: User;
  token?: string;
  require_verification?: boolean;
  email?: string;
};

export async function register(payload: RegisterPayload) {
  const { data } = await api.post<AuthResponse>("/register", payload);
  return data;
}

export async function login(payload: LoginPayload) {
  const { data } = await api.post<AuthResponse>("/login", payload);
  return data;
}

export async function getCurrentUser() {
  const { data } = await api.get<User>("/me");
  return data;
}

export async function logout() {
  const { data } = await api.post("/logout");
  return data;
}