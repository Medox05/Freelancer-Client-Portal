import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAvailableUsers, getCallHistory, deleteCallRecord, deleteAllCallHistory, type User, type VideoCall as VideoCallType } from "../services/video-call-service";
import { Phone, Clock, PhoneIncoming, PhoneOutgoing, Users, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useVideoCall } from "../context/VideoCallContext";

function isOnline(lastSeen?: string) {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 120_000;
}

export default function VideoCallPage() {
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<"freelancer" | "client" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const { isCallActive, callUser, isCallActionPending, activeCall } = useVideoCall();
  const queryClient = useQueryClient();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUserId(user.id ? Number(user.id) : null);
    setUserRole(user.role);
  }, []);

  const { data: availableUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ["available-users"], queryFn: getAvailableUsers, refetchInterval: 30000, staleTime: 10000, gcTime: 5 * 60 * 1000,
  });

  const sortedUsers = [...availableUsers].sort((a, b) => {
    const aOnline = isOnline(a.last_seen_at);
    const bOnline = isOnline(b.last_seen_at);
    if (aOnline && !bOnline) return -1;
    if (!aOnline && bOnline) return 1;
    return a.name.localeCompare(b.name);
  });

  const handleCallClick = (user: User) => {
    if (!isOnline(user.last_seen_at)) toast.warning(`${user.name} is currently offline`, { description: "They might not receive your call until they open the app.", duration: 5000 });
    callUser(user.id);
  };

  const { data: callHistory = [], isLoading: historyLoading } = useQuery<VideoCallType[]>({ queryKey: ["call-history"], queryFn: getCallHistory, staleTime: 30000 });

  const deleteOneMutation = useMutation({
    mutationFn: deleteCallRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["call-history"] });
      toast.success("Call record deleted");
    },
    onError: () => toast.error("Failed to delete call record"),
  });

  const deleteAllMutation = useMutation({
    mutationFn: deleteAllCallHistory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["call-history"] });
      toast.success("Call history cleared");
    },
    onError: () => toast.error("Failed to clear call history"),
  });

  const handleDeleteOne = (callId: number) => {
    setDeleteTarget(callId);
  };

  const handleDeleteAll = () => {
    setShowClearAllConfirm(true);
  };

  const confirmDeleteOne = () => {
    if (deleteTarget !== null) {
      deleteOneMutation.mutate(deleteTarget);
      setDeleteTarget(null);
    }
  };

  const confirmClearAll = () => {
    deleteAllMutation.mutate();
    setShowClearAllConfirm(false);
  };

  const formatDuration = (start?: string, end?: string) => {
    if (!start || !end) return "—";
    const s = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000);
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  const renderCallHistory = () => (
    <div className="rounded-3xl border border-slate-200 p-6 dark:border-slate-800">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800"><Clock size={20} className="text-slate-600 dark:text-slate-300" /></div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Call History</h2>
        </div>
        {callHistory.length > 0 && (
          <button
            onClick={handleDeleteAll}
            disabled={deleteAllMutation.isPending}
            className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 cursor-pointer"
          >
            <Trash2 size={14} />
            {deleteAllMutation.isPending ? "Clearing..." : "Clear All"}
          </button>
        )}
      </div>
      {historyLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => (<div key={i} className="animate-pulse flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"><div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-600" /><div className="flex-1 space-y-2"><div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-600" /><div className="h-3 w-48 rounded bg-slate-100 dark:bg-slate-700" /></div></div>))}</div>
      ) : callHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700"><Phone size={32} className="text-slate-400 dark:text-slate-500 mb-3" /><p className="text-slate-500 dark:text-slate-400">No call history yet</p></div>
      ) : (
        <div className="space-y-2">{callHistory.map(call => {
          const isCaller = Number(call.caller_id) === currentUserId;
          const otherPerson = isCaller ? call.callee : call.caller;
          const wasAnswered = call.status === "ended" && call.started_at;
          return (<div key={call.id} className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 dark:border-slate-700 dark:bg-slate-800">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${call.status === "rejected" ? "bg-red-100 dark:bg-red-500/20" : wasAnswered ? "bg-green-100 dark:bg-green-500/20" : "bg-slate-100 dark:bg-slate-700"}`}>
              {isCaller ? <PhoneOutgoing size={18} className={call.status === "rejected" ? "text-red-500" : "text-green-600 dark:text-green-400"} /> : <PhoneIncoming size={18} className={call.status === "rejected" ? "text-red-500" : "text-green-600 dark:text-green-400"} />}
            </div>
            <div className="flex-1 min-w-0"><p className="font-semibold text-slate-900 dark:text-white truncate">{otherPerson?.name || "Unknown"}</p><p className="text-xs text-slate-500 dark:text-slate-400">{isCaller ? "Outgoing" : "Incoming"}{call.status === "rejected" && " · Declined"}{wasAnswered && ` · ${formatDuration(call.started_at, call.ended_at)}`}</p></div>
            <p className="text-xs text-slate-400 dark:text-slate-500 shrink-0">{new Date(call.created_at).toLocaleDateString([], { month: "short", day: "numeric" })} {new Date(call.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
            <button
              onClick={() => handleDeleteOne(call.id)}
              disabled={deleteOneMutation.isPending}
              className="shrink-0 rounded-lg p-2 text-slate-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 disabled:opacity-50 dark:hover:bg-red-500/10 dark:hover:text-red-400 cursor-pointer"
              title="Delete this record"
            >
              <Trash2 size={16} />
            </button>
          </div>);
        })}</div>
      )}
    </div>
  );

  return (
    <>
    <div className="flex flex-col gap-8 p-8">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Calls</h1>

      {/* Active Call UI rendered via global VideoCallOverlay layout */}

      {/* Client View */}
      {!isCallActive && userRole === "client" && (
        <div className="space-y-6">
          {availableUsers.length > 0 && (
            <div className="rounded-3xl border border-slate-200 p-6 dark:border-slate-800">
              <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">Your Freelancer</h2>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{sortedUsers.map((user: User) => (
                <div key={user.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600">
                  <div className="flex-1">
                    <div className="flex items-center gap-2"><div className="relative flex h-2.5 w-2.5">{isOnline(user.last_seen_at) && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>}<span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${isOnline(user.last_seen_at) ? "bg-green-500" : "bg-slate-400"}`}></span></div><p className="font-semibold text-slate-900 dark:text-white">{user.name}</p></div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 ml-4">{user.email}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 ml-4 mt-1">{isOnline(user.last_seen_at) ? "Online now" : user.last_seen_at ? `Last seen: ${new Date(user.last_seen_at).toLocaleTimeString()}` : "Offline"}</p>
                  </div>
                  <button onClick={() => handleCallClick(user)} disabled={isCallActionPending || !!activeCall?.id} className="cursor-pointer ml-3 flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 font-semibold text-white transition hover:bg-blue-600 disabled:bg-slate-400 disabled:cursor-not-allowed"><Phone size={16} /> Call</button>
                </div>
              ))}</div>
            </div>
          )}
          {renderCallHistory()}
        </div>
      )}

      {/* Freelancer View */}
      {!isCallActive && userRole === "freelancer" && (<>
        <div className="rounded-3xl border border-slate-200 p-6 dark:border-slate-800">
          <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">{`Available to Call (${availableUsers.length})`}</h2>
          {usersLoading ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{[1,2,3].map(i => (<div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"><div className="flex items-center gap-3"><div className="h-3 w-3 rounded-full bg-slate-200 dark:bg-slate-600" /><div className="h-5 w-32 rounded-lg bg-slate-200 dark:bg-slate-600" /></div><div className="mt-2 ml-6 h-4 w-40 rounded-lg bg-slate-100 dark:bg-slate-700" /></div>))}</div>
          ) : availableUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-sm mb-4 ring-1 ring-slate-200 dark:ring-slate-700"><Users size={32} className="text-slate-400 dark:text-slate-500" /></div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No contacts available</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md text-sm leading-relaxed">You haven't added any clients yet. Add clients in the Clients tab and they will appear here once they accept their invitations.</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{sortedUsers.map((user: User) => (
              <div key={user.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600">
                <div className="flex-1">
                  <div className="flex items-center gap-2"><div className="relative flex h-2.5 w-2.5">{isOnline(user.last_seen_at) && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>}<span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${isOnline(user.last_seen_at) ? "bg-green-500" : "bg-slate-400"}`}></span></div><p className="font-semibold text-slate-900 dark:text-white">{user.name}</p></div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 ml-4">{user.email}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 ml-4 mt-1">{isOnline(user.last_seen_at) ? "Online now" : user.last_seen_at ? `Last seen: ${new Date(user.last_seen_at).toLocaleTimeString()}` : "Offline"}</p>
                </div>
                <button onClick={() => handleCallClick(user)} disabled={isCallActionPending || !!activeCall?.id} className="cursor-pointer ml-3 flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 font-semibold text-white transition hover:bg-blue-600 disabled:bg-slate-400 disabled:cursor-not-allowed"><Phone size={16} /> Call</button>

              </div>
            ))}</div>
          )}
        </div>
        {renderCallHistory()}
      </>)}
    </div>

      {/* Confirm Delete Single Record */}
      {deleteTarget !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold">Confirm Delete</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  You are about to delete this call record.
                </p>
              </div>
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
              <p className="text-sm text-slate-600 dark:text-slate-300">This action cannot be undone.</p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="cursor-pointer rounded-2xl border border-slate-300 px-4 py-2.5 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteOne}
                disabled={deleteOneMutation.isPending}
                className="cursor-pointer rounded-2xl bg-red-600 px-4 py-2.5 font-medium text-white transition hover:bg-red-500 disabled:opacity-60"
              >
                {deleteOneMutation.isPending ? "Deleting..." : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Clear All */}
      {showClearAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold">Clear Call History</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  You are about to delete all call records.
                </p>
              </div>
              <button
                onClick={() => setShowClearAllConfirm(false)}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
              <p className="text-sm text-slate-600 dark:text-slate-300">This will permanently remove all call history. This action cannot be undone.</p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowClearAllConfirm(false)}
                className="cursor-pointer rounded-2xl border border-slate-300 px-4 py-2.5 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmClearAll}
                disabled={deleteAllMutation.isPending}
                className="cursor-pointer rounded-2xl bg-red-600 px-4 py-2.5 font-medium text-white transition hover:bg-red-500 disabled:opacity-60"
              >
                {deleteAllMutation.isPending ? "Clearing..." : "Yes, clear all"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
