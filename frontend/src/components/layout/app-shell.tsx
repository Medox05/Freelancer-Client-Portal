import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./sidebar";
import Topbar from "./topbar";
import api from "../../lib/axios";
import { VideoCallProvider, useVideoCall } from "../../context/VideoCallContext";
import { VideoCallOverlay } from "../video-call/video-call-overlay";

function AppShellContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { isCallActive } = useVideoCall();

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
    // Ping every 5 seconds during active call, every 30 seconds otherwise
    const interval = isCallActive ? 5000 : 30000;
    intervalId = window.setInterval(pingPresence, interval);

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
  }, [isCallActive]);

  // Automatically close sidebar when navigation path changes on mobile/tablet
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <div className="flex min-h-screen relative overflow-x-hidden lg:overflow-x-visible">
        {/* Mobile Sidebar backdrop overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs transition-opacity lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar onMenuClick={() => setSidebarOpen(true)} />
          <main className="p-4 sm:p-6 flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default function AppShell() {
  return (
    <VideoCallProvider>
      <AppShellContent />
      <VideoCallOverlay />
    </VideoCallProvider>
  );
}