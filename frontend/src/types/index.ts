export type ProjectStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "canceled";

export type UserRole = "freelancer" | "client";

export type User = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  last_seen_at?: string | null;
};

export type Client = {
  id: number;
  name: string;
  email: string;
};

export type Project = {
  user: any;
  id: number;
  user_id: number;
  client_id: number;
  title: string;
  description: string | null;
  budget: number | string | null;
  status: ProjectStatus;
  due_date: string | null;
  created_at?: string;
  updated_at?: string;
  client?: Client;
};

export type ProjectFormPayload = {
  client_id: number;
  title: string;
  description?: string;
  budget?: number | null;
  status: ProjectStatus;
  due_date: string;
};

