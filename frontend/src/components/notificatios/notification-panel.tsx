import { Bell, CheckCheck, Trash2 } from "lucide-react";
import type { AppNotification } from "../../types/notification";

type Props = {
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onToggleRead: (id: number) => void;
};

export default function NotificationPanel({
  notifications,
  onMarkAllRead,
  onClearAll,
  onToggleRead,
}: Props) {
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getTypeClass = (type: AppNotification["type"]) => {
    if (type === "success") {
      return "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300";
    }

    if (type === "warning") {
      return "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300";
    }

    return "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300";
  };

  return (
    <div className="absolute right-0 top-full z-50 mt-3 w-[360px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-200 p-4 dark:border-slate-800">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Notifications</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {unreadCount} unread
            </p>
          </div>

          <Bell className="text-slate-400" size={18} />
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onMarkAllRead}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <CheckCheck size={15} />
            Mark all read
          </button>

          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex items-center gap-2 rounded-xl border border-red-300 px-3 py-2 text-sm text-red-700 transition hover:bg-red-50 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10"
          >
            <Trash2 size={15} />
            Clear all
          </button>
        </div>
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
            No notifications yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => onToggleRead(notification.id)}
                className={`block w-full p-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                  !notification.isRead ? "bg-slate-50/70 dark:bg-slate-800/20" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-1 text-[11px] font-medium ${getTypeClass(
                          notification.type
                        )}`}
                      >
                        {notification.type}
                      </span>

                      {!notification.isRead && (
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                      )}
                    </div>

                    <p className="mt-2 font-medium">{notification.title}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {notification.message}
                    </p>
                  </div>

                  <span className="shrink-0 text-xs text-slate-400">
                    {notification.createdAt}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}