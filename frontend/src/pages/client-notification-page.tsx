import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  CheckCircle2, 
  Trash2, 
  FileText, 
  FileSignature, 
  CreditCard, 
  Calendar, 
  Bell, 
  Folder 
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../services/notification-service";
import api from "../lib/axios";

type NotificationItem = {
  id: number;
  type: string;
  title?: string | null;
  message: string;
  is_read: boolean;
  project_id?: number | null;
  milestone_id?: number | null;
  conversation_id?: number | null;
  created_at?: string | null;
};

function formatDateTime(date?: string | null) {
  if (!date) return "-";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "-";

  return parsed.toLocaleString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getNotificationIcon(type: string) {
  const iconSize = 28;
  switch (type) {
    case "contract_sent":
      return {
        icon: <FileText size={iconSize} />,
        bgClass: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
      };
    case "contract_signed":
      return {
        icon: <FileSignature size={iconSize} />,
        bgClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
      };
    case "project_file":
      return {
        icon: <Folder size={iconSize} />,
        bgClass: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
      };
    case "meeting_created":
    case "meeting_updated":
      return {
        icon: <Calendar size={iconSize} />,
        bgClass: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300",
      };
    default:
      if (type && type.startsWith("invoice_")) {
        return {
          icon: <CreditCard size={iconSize} />,
          bgClass: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300",
        };
      }
      return {
        icon: <Bell size={iconSize} />,
        bgClass: "bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300",
      };
  }
}

function getNotificationHref(notification: NotificationItem, role?: string) {
  const isFreelancer = role === "freelancer";
  const projectBase = isFreelancer ? "/projects" : "/client-projects";

  if (notification.type && notification.type.startsWith("contract_") && notification.project_id) {
    return `${projectBase}/${notification.project_id}?tab=contracts`;
  }

  if (notification.type === "project_file" && notification.project_id) {
    return `${projectBase}/${notification.project_id}?tab=files`;
  }

  if (notification.type === "project_deleted") {
    return projectBase; // redirect list
  }

  if (notification.type && notification.type.startsWith("invoice_") && notification.project_id) {
    return `${projectBase}/${notification.project_id}?tab=invoices`;
  }

  if (notification.type && notification.type.includes("milestone") && notification.project_id) {
    return `${projectBase}/${notification.project_id}?tab=milestones`;
  }

  if (notification.project_id) {
    return `${projectBase}/${notification.project_id}`;
  }

  if (notification.conversation_id) {
    return `/chat?conversation=${notification.conversation_id}`;
  }

  if (notification.type && notification.type.startsWith("meeting_")) {
    return "/meetings";
  }

  return null;
}

export default function ClientNotificationPage() {
  const queryClient = useQueryClient();

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await api.get("/me");
      return data;
    },
    staleTime: 30000,
  });

  const { data: notifications = [], isLoading, isError } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
  });

  const markOneMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read.");
    },
    onError: () => {
      toast.error("Failed to mark all notifications as read.");
    },
  });

  const deleteOneMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Notification deleted.");
    },
    onError: () => {
      toast.error("Failed to delete notification.");
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: deleteAllNotifications,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications deleted.");
    },
    onError: () => {
      toast.error("Failed to delete all notifications.");
    },
  });

  async function handleOpen(notification: NotificationItem) {
    if (!notification.is_read) {
      try {
        await markOneMutation.mutateAsync(notification.id);
      } catch {
        // ignore
      }
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-slate-500 dark:text-slate-400">
          Loading notifications...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm dark:border-red-500/30 dark:bg-red-500/10">
        <p className="text-red-600 dark:text-red-300">
          Failed to load notifications.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Notifications
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Stay updated on your projects, files and messages.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending || notifications.length === 0}
            className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Mark all read
          </button>

          <button
            type="button"
            onClick={() => deleteAllMutation.mutate()}
            disabled={deleteAllMutation.isPending || notifications.length === 0}
            className="inline-flex items-center gap-2 rounded-2xl border border-red-500 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/10"
          >
            <Trash2 size={16} />
            Delete all
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 p-6 dark:border-slate-800">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Recent Notifications
          </h2>
        </div>

        {notifications.length === 0 ? (
          <div className="p-10 text-center text-slate-500 dark:text-slate-400">
            No notifications yet.
          </div>
        ) : (
          <div>
            {notifications.map((notification) => {
              const href = getNotificationHref(notification, me?.role);

              const { icon, bgClass } = getNotificationIcon(notification.type);

              const cardContent = (
                <>
                  <div className="flex min-w-0 items-start gap-4">
                    <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${bgClass}`}>
                      {icon}
                    </div>

                    <div className="min-w-0">
                      <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                        {notification.title || notification.type}
                      </p>

                      <p className="mt-2 text-slate-500 dark:text-slate-400">
                        {notification.message}
                      </p>

                      <p className="mt-4 text-sm text-slate-400 dark:text-slate-500">
                        {formatDateTime(notification.created_at)}
                      </p>

                      {!notification.is_read && (
                        <span className="mt-3 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                          Unread
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    {!notification.is_read && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          markOneMutation.mutate(notification.id);
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <CheckCircle2 size={16} />
                        Mark read
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteOneMutation.mutate(notification.id);
                      }}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-red-500 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/10"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </>
              );

              if (href) {
                return (
                  <Link
                    key={notification.id}
                    to={href}
                    onClick={() => handleOpen(notification)}
                    className="flex items-start justify-between gap-4 border-t border-slate-200 p-6 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
                  >
                    {cardContent}
                  </Link>
                );
              }

              return (
                <div
                  key={notification.id}
                  className="flex items-start justify-between gap-4 border-t border-slate-200 p-6 dark:border-slate-800"
                >
                  {cardContent}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}