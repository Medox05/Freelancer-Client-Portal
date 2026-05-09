export type AppNotification = {
  id: number;
  title: string;
  message: string;
  type: "info" | "success" | "warning";
  isRead: boolean;
  createdAt: string;
};