import { useMemo, useState } from "react";
import type { AppNotification } from "../types/notification";

const initialNotifications: AppNotification[] = [
  {
    id: 1,
    title: "Welcome",
    message: "Your workspace is ready.",
    type: "info",
    isRead: false,
    createdAt: "now",
  },
];

export function useNotifications() {
  const [notifications, setNotifications] =
    useState<AppNotification[]>(initialNotifications);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const toggleRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n))
    );
  };

  const addNotification = (notification: Omit<AppNotification, "id">) => {
    setNotifications((prev) => [
      {
        id: Date.now(),
        ...notification,
      },
      ...prev,
    ]);
  };

  return {
    notifications,
    unreadCount,
    markAllRead,
    clearAll,
    toggleRead,
    addNotification,
  };
}