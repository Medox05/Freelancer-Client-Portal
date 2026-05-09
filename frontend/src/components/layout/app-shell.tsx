import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./sidebar";
import Topbar from "./topbar";
import api from "../../lib/axios";
import { VideoCallProvider } from "../../context/VideoCallContext";

export default function AppShell() {
  useEffect(() => {
    let intervalId: number | undefined;

    const pingPresence = async () => {
      try {
        await api.post("/presence/ping");
      } catch (error) {
        // Presence ping failed
      }
    };

    pingPresence();
    intervalId = window.setInterval(pingPresence, 10000);

    const handleFocus = () => {
      pingPresence();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        pingPresence();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
      }
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <VideoCallProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1">
            <Topbar />
            <main className="p-4 sm:p-6">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </VideoCallProvider>
  );
}