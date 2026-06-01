import {
  FileText,
  FolderKanban,
  LayoutDashboard,
  MessageCircle,
  Users,
  Video,
  Calendar,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { getConversations } from "../../services/chat-service";
import { type VideoCall as VideoCallType } from "../../services/video-call-service";
import { getMeetings } from "../../services/meeting-service";
import api from "../../lib/axios";
import { useTheme } from "../../lib/theme";
import { sounds } from "../../lib/sounds";
import { useVideoCall } from "../../context/VideoCallContext";

type MeResponse = {
  id: number;
  name: string;
  email: string;
  role: "freelancer" | "client";
};

function getStoredUser(): MeResponse | null {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const storedUser = getStoredUser();
  const { theme } = useTheme();



  const { data } = useQuery({
    queryKey: ["chat-conversations"],
    queryFn: getConversations,
    refetchInterval: 45000,
    staleTime: 10000,
  });

  const conversations = Array.isArray(data) ? data : [];

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await api.get<MeResponse>("/me");
      localStorage.setItem("user", JSON.stringify(data));
      return data;
    },
    retry: false,
  });

  const currentUser = me || storedUser;
  const isClient = currentUser?.role === "client";

  const unreadChatCount = conversations.reduce(
    (sum: number, conversation: any) => sum + (conversation.unreadCount || 0),
    0
  );



  const previousUnreadCount = useRef<number>(0);
  useEffect(() => {
    if (unreadChatCount > previousUnreadCount.current) {
      sounds.playNotification();
    }
    previousUnreadCount.current = unreadChatCount;
  }, [unreadChatCount]);

  const { activeCall, isRingingForCallee } = useVideoCall();

  const { data: meetingsData } = useQuery({
    queryKey: ["meetings"],
    queryFn: getMeetings,
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const meetings = Array.isArray(meetingsData) ? meetingsData : [];

  const pendingIncomingMeetingsCount = meetings.filter(
    (meeting) => meeting.status === "pending" && meeting.created_by !== currentUser?.id
  ).length;

  const isIncomingCall = isRingingForCallee;

  const previousCallId = useRef<number | null>(null);

  useEffect(() => {
    if (isIncomingCall && activeCall?.id && activeCall.id !== previousCallId.current) {
      sounds.startRinging();
      toast.info(`Incoming Call from ${activeCall.caller?.name || "User"}`, {
        description: "Click 'Calls' in sidebar to answer.",
        duration: 10000,
      });
      previousCallId.current = activeCall.id;
    } else if (!isIncomingCall) {
      sounds.stopRinging();
    }
  }, [isIncomingCall, activeCall]);

  useEffect(() => {
    let title = "MhFlow";
    let badgeCount = 0;

    if (isIncomingCall) {
      title = "📞 Incoming Call - MhFlow";
      badgeCount = 1;
    } else if (unreadChatCount > 0) {
      title = `(${unreadChatCount}) MhFlow`;
      badgeCount = unreadChatCount;
    }

    document.title = title;

    if ('setAppBadge' in navigator) {
      if (badgeCount > 0) {
        (navigator as any).setAppBadge(badgeCount).catch(() => {});
      } else if ('clearAppBadge' in navigator) {
        (navigator as any).clearAppBadge().catch(() => {});
      }
    }
  }, [unreadChatCount, isIncomingCall]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center justify-between rounded-2xl px-5 py-4 font-medium transition ${
      isActive
        ? "bg-slate-950 text-white dark:bg-white dark:text-slate-900"
        : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
    }`;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-80 transform overflow-y-auto border-r border-slate-200 bg-white px-6 py-8 transition-transform duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-950 lg:static lg:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="mb-10">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <img src={theme === "dark" ? "/M_nobackround_White.png" : "/M_nobackround_Black.png"} className="h-8 w-auto object-contain drop-shadow-sm dark:drop-shadow-md" alt="MhFlow Logo" />
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-slate-100 dark:to-slate-400">
              MhFlow
            </h1>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition-all hover:bg-slate-100 active:scale-95 lg:hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
            type="button"
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {isClient ? "Client Portal" : "Freelancer Portal"}
        </p>
      </div>

      <div className="mb-10 rounded-3xl border border-slate-200 p-5 dark:border-slate-800">
        <p className="truncate text-2xl font-semibold text-slate-900 dark:text-white">
          {currentUser?.name || "Loading..."}
        </p>
        <p className="mt-2 truncate text-slate-500 dark:text-slate-400">
          {currentUser?.email || ""}
        </p>
      </div>

      <nav className="space-y-4">
        {isClient ? (
          <>
            <NavLink to="/client-dashboard" className={linkClass}>
              <span className="flex items-center gap-3">
                <LayoutDashboard size={20} />
                Dashboard
              </span>
            </NavLink>

            <NavLink to="/client-projects" className={linkClass}>
              <span className="flex items-center gap-3">
                <FolderKanban size={20} />
                My Projects
              </span>
            </NavLink>


            <NavLink to="/client-files" className={linkClass}>
              <span className="flex items-center gap-3">
                <FileText size={20} />
                Files
              </span>
            </NavLink>

            <NavLink to="/chat" className={linkClass}>
              <span className="flex items-center gap-3">
                <MessageCircle size={20} />
                Chat
              </span>

              {unreadChatCount > 0 && (
                <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-red-500 px-2 text-xs font-bold text-white">
                  {unreadChatCount}
                </span>
              )}
            </NavLink>

            <NavLink to="/calls" className={linkClass}>
              <span className="flex items-center gap-3">
                <Video size={20} />
                Calls
              </span>
              {isIncomingCall && (
                <span className="inline-flex h-6 items-center justify-center rounded-full bg-blue-500 px-3 text-xs font-bold text-white animate-pulse">
                  Ringing...
                </span>
              )}
            </NavLink>

            <NavLink to="/meetings" className={linkClass}>
              <span className="flex items-center gap-3">
                <Calendar size={20} />
                Meetings
              </span>

              {pendingIncomingMeetingsCount > 0 && (
                <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-amber-500 px-2 text-xs font-bold text-white">
                  {pendingIncomingMeetingsCount}
                </span>
              )}
            </NavLink>
            
          </>
        ) : (
          <>
            <NavLink to="/dashboard" className={linkClass}>
              <span className="flex items-center gap-3">
                <LayoutDashboard size={20} />
                Dashboard
              </span>
            </NavLink>

            <NavLink to="/clients" className={linkClass}>
              <span className="flex items-center gap-3">
                <Users size={20} />
                Clients
              </span>
            </NavLink>

            <NavLink to="/projects" className={linkClass}>
              <span className="flex items-center gap-3">
                <FolderKanban size={20} />
                Projects
              </span>
            </NavLink>

            <NavLink to="/chat" className={linkClass}>
              <span className="flex items-center gap-3">
                <MessageCircle size={20} />
                Chat
              </span>

              {unreadChatCount > 0 && (
                <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-red-500 px-2 text-xs font-bold text-white">
                  {unreadChatCount}
                </span>
              )}
            </NavLink>

            <NavLink to="/calls" className={linkClass}>
              <span className="flex items-center gap-3">
                <Video size={20} />
                Calls
              </span>
              {isIncomingCall && (
                <span className="inline-flex h-6 items-center justify-center rounded-full bg-blue-500 px-3 text-xs font-bold text-white animate-pulse">
                  Ringing...
                </span>
              )}
            </NavLink>

            <NavLink to="/meetings" className={linkClass}>
              <span className="flex items-center gap-3">
                <Calendar size={20} />
                Meetings
              </span>

              {pendingIncomingMeetingsCount > 0 && (
                <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-amber-500 px-2 text-xs font-bold text-white">
                  {pendingIncomingMeetingsCount}
                </span>
              )}
            </NavLink>
            
          </>
        )}
      </nav>
    </aside>
  );
}