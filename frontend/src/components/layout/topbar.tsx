import { Bell, LogOut, Loader2 } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import api from "../../lib/axios";
import ThemeToggle from "../theme-toggle";
import { useTheme } from "../../lib/theme";

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
};

async function getNotifications() {
  const { data } = await api.get<NotificationItem[]>("/notifications");
  return data;
}

export default function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { toggleTheme } = useTheme();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
  });

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  const isClient =
    location.pathname === "/client" || location.pathname.startsWith("/client/");

  const notificationsLink = isClient
    ? "/client/notifications"
    : "/notifications";

  const isNotificationsPage = location.pathname === notificationsLink;

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await api.post("/logout");
    } catch {
      // ignore logout API error
    } finally {
      localStorage.removeItem("token");
      queryClient.clear();
      navigate("/login", { replace: true });
      setIsLoggingOut(false);
    }
  };

  const buttonClass =
    "relative cursor-pointer flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-300 bg-white text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-100 active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";

  const activeButtonClass =
    "relative cursor-pointer flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-900 bg-slate-900 text-white shadow-sm transition-all duration-200 active:scale-95 dark:border-white dark:bg-white dark:text-slate-900";

  const logoutButtonClass =
    "relative cursor-pointer flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-300 bg-white text-slate-700 shadow-sm transition-all duration-200 hover:border-red-500 hover:bg-red-50 hover:text-red-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400";

  return (
    <header className="flex items-center justify-end border-b border-slate-200 px-8 py-4 dark:border-slate-800">
      <div className="flex items-center gap-4">
        <div className="group relative">
  <button onClick={toggleTheme} className={buttonClass} type="button">
    <ThemeToggle />
  </button>

  <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 dark:bg-white dark:text-slate-900">
    Toggle theme
  </div>
</div>

        <div className="group relative">
  <Link
    to={notificationsLink}
    className={isNotificationsPage ? activeButtonClass : buttonClass}
  >
    <Bell size={22} />
    {unreadCount > 0 && (
      <span className="absolute -right-1 -top-1 inline-flex min-h-[22px] min-w-[22px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
        {unreadCount > 99 ? "99+" : unreadCount}
      </span>
    )}
  </Link>

  <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 dark:bg-white dark:text-slate-900">
    Notifications
  </div>
</div>

        

        <div className="group relative">
          <button
            onClick={handleLogout}
            className={logoutButtonClass}
            type="button"
            disabled={isLoggingOut}
            title={isLoggingOut ? "Logging out..." : "Logout"}
          >
            {isLoggingOut ? (
              <Loader2 size={22} className="animate-spin" />
            ) : (
              <LogOut size={22} />
            )}
          </button>

          <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 dark:bg-white dark:text-slate-900">
            {isLoggingOut ? "Logging out..." : "Logout"}
          </div>
        </div>
      </div>
    </header>
  );
}