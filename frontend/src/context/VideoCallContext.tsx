import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  initiateCall, acceptCall, rejectCall, endCall, getActiveCall, type User
} from "../services/video-call-service";
import { usePeerJS } from "../hooks/use-peerjs";
import { toast } from "sonner";
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Monitor, Maximize } from "lucide-react";
import { useLocation } from "react-router-dom";
import { sounds } from "../lib/sounds";

interface VideoCallContextType {
  activeCall: any;
  isCallActive: boolean;
  isRingingForCallee: boolean;
  isCallActionPending: boolean;
  callUser: (userId: number) => void;
  acceptTheCall: (callId: number) => void;
  rejectTheCall: (callId: number) => void;
  endTheCall: (callId: number) => void;
  setPortalTarget: (node: HTMLElement | null) => void;
}

const VideoCallContext = createContext<VideoCallContextType | null>(null);

export function useVideoCall() {
  const context = useContext(VideoCallContext);
  if (!context) throw new Error("useVideoCall must be used within a VideoCallProvider");
  return context;
}

export function VideoCallProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserName, setCurrentUserName] = useState("");
  const [isRemoteCameraOn, setIsRemoteCameraOn] = useState(false);
  const [isRemoteMicOn, setIsRemoteMicOn] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoContainerRef = useRef<HTMLDivElement>(null);
  const lastEndedCallIdRef = useRef<number | null>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUserId(user.id ? Number(user.id) : null);
    setCurrentUserName(user.name || "User");
  }, []);

  const handleRemoteStream = useCallback((stream: MediaStream) => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
  }, []);

  const handleDataMessage = useCallback((data: any) => {
    if (data.type === "CAMERA") setIsRemoteCameraOn(data.value);
    else if (data.type === "MIC") setIsRemoteMicOn(data.value);
    else if (data.type === "CALL_ACCEPTED") queryClient.invalidateQueries({ queryKey: ["active-call"] });
  }, [queryClient]);

  const handleCallReceived = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["active-call"] });
  }, [queryClient]);

  const { localStreamRef, mediaError, isCameraOn, isMicOn, callPeer, answerCall, fallbackCall, stopMediaStream, toggleCamera, toggleMicrophone, isScreenSharing, toggleScreenShare } =
    usePeerJS({ userId: currentUserId, onRemoteStream: handleRemoteStream, onDataMessage: handleDataMessage, onCallReceived: handleCallReceived });



  const { mutate: callUser, isPending: isCallingPending } = useMutation({
    onMutate: async (calleeId: number) => {
      await queryClient.cancelQueries({ queryKey: ["active-call"] });
      const callee = queryClient.getQueryData<User[]>(["available-users"])?.find((u: User) => u.id === calleeId);
      if (callee) queryClient.setQueryData(["active-call"], { id: -1, caller_id: currentUserId, callee_id: calleeId, status: "ringing", callee, caller: { id: currentUserId, name: currentUserName } });
    },
    mutationFn: async (calleeId: number) => {
      callPeer(calleeId).catch(() => {});
      const callData = await initiateCall(calleeId);
      queryClient.setQueryData(["active-call"], callData);
      return callData;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["active-call"] }); },
    onError: (error: any) => { toast.error("Failed to initiate call"); queryClient.setQueryData(["active-call"], null); stopMediaStream(); },
  });

  const { mutate: acceptTheCall, isPending: isAcceptPending } = useMutation({
    mutationFn: async (callId: number) => {
      answerCall().catch(() => {});
      const result = await acceptCall(callId);
      return result;
    },
    onMutate: () => {
      const c = queryClient.getQueryData(["active-call"]) as any;
      if (c) queryClient.setQueryData(["active-call"], { ...c, status: "accepted", started_at: new Date().toISOString() });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["active-call"], data);
      if (data?.caller_id) fallbackCall(data.caller_id);
      queryClient.invalidateQueries({ queryKey: ["active-call"] });
    },
    onError: () => { toast.error("Failed to accept call"); },
  });

  const { mutate: rejectTheCall, isPending: isRejectPending } = useMutation({
    mutationFn: (callId: number) => rejectCall(callId),
    onMutate: () => { queryClient.setQueryData(["active-call"], null); stopMediaStream(); },
    onError: () => { toast.error("Failed to reject call"); },
  });

  const { mutate: endTheCall, isPending: isEndPending } = useMutation({
    mutationFn: (callId: number) => endCall(callId),
    onMutate: () => { queryClient.setQueryData(["active-call"], null); stopMediaStream(); },
    onError: () => { toast.error("Failed to end call"); },
  });

  const { data: activeCalls } = useQuery({
    queryKey: ["active-call"], queryFn: getActiveCall, refetchInterval: 500, staleTime: 100, gcTime: 5 * 60 * 1000,
    enabled: !isCallingPending && !isAcceptPending && !!currentUserId,
  });
  const activeCall = activeCalls ?? null;

  useEffect(() => {
    if (activeCall?.id && localVideoRef.current && localStreamRef.current) {
      if (localVideoRef.current.srcObject !== localStreamRef.current) localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [activeCall?.id, activeCall?.status, isCameraOn, isScreenSharing]);

  useEffect(() => {
    if ((activeCall?.status === "rejected" || activeCall?.status === "ended") && activeCall.id !== lastEndedCallIdRef.current) {
      stopMediaStream();
      lastEndedCallIdRef.current = activeCall.id;
      const otherUser = activeCall.caller_id === currentUserId ? activeCall.callee : activeCall.caller;
      const name = otherUser?.name || "User";
      
      sounds.playNotification();
      
      if (activeCall.status === "rejected") toast.error("Call Declined", { description: `${name} declined your call.` });
      else toast.info("Call Ended", { description: `The call with ${name} has ended.` });
      setTimeout(() => queryClient.setQueryData(["active-call"], null), 500);
      setIsFullscreen(false);
    }
  }, [activeCall?.status, activeCall?.id]);

  const isRingingForCallee = Boolean(activeCall?.status === "ringing" && Number(activeCall.callee_id) === currentUserId);
  const isCallActive = Boolean(activeCall?.id && (activeCall.status === "ringing" || activeCall.status === "accepted"));
  const isCallActionPending = Boolean(isCallingPending || isAcceptPending || isRejectPending || isEndPending);

  const getOtherUserName = () => {
    if (!activeCall) return "User";
    const other = activeCall.caller_id === currentUserId ? activeCall.callee : activeCall.caller;
    return other?.name || "User";
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      remoteVideoContainerRef.current?.requestFullscreen().catch(() => {
        // Failed to enable fullscreen
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const isVideoCallPage = location.pathname === "/calls";

  const renderActiveCallUI = () => {
    if (!isCallActive || !activeCall) return null;

    // If on video call page, we want it large. If on other pages, it's a PIP floating window.
    const containerClasses = isVideoCallPage 
      ? "rounded-3xl border-2 border-green-500 bg-green-50 dark:border-green-600 dark:bg-green-900/20 p-6"
      : "fixed bottom-6 right-6 w-96 z-50 rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800 p-4 flex flex-col gap-4";

    const videoGridClasses = isVideoCallPage
      ? "grid gap-6 md:grid-cols-2"
      : "grid gap-2 grid-cols-2";

    const videoContainerClasses = isVideoCallPage
      ? "h-[320px] rounded-3xl"
      : "h-[120px] rounded-xl";

    const ui = (
      <div className={containerClasses}>
        {/* Call Info header (PIP mode) */}
        {!isVideoCallPage && (
          <div className="flex justify-between items-center px-1">
            <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
              {activeCall.status === "ringing" ? "Connecting..." : getOtherUserName()}
            </p>
            {activeCall.started_at && activeCall.status === "accepted" && (
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">Active</span>
            )}
          </div>
        )}

        <div className={videoGridClasses}>
          {/* Local Video */}
          <div className={`${videoContainerClasses} bg-slate-200 dark:bg-slate-700 overflow-hidden relative border border-slate-300 dark:border-slate-600 shadow-sm ring-1 ring-black/5`}>
            <video ref={localVideoRef} className="h-full w-full bg-slate-900 object-cover" autoPlay playsInline muted />
            {!isCameraOn && (<div className="absolute inset-0 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm"><div className="flex flex-col items-center gap-2"><div className={`rounded-full bg-slate-800 ${isVideoCallPage ? 'p-5' : 'p-2'} ring-1 ring-white/10`}><VideoOff size={isVideoCallPage ? 36 : 20} className="text-white/60" /></div>{!isVideoCallPage ? null : <span className="text-white/90 font-medium text-lg">Camera off</span>}</div></div>)}
            <div className={`absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded-lg backdrop-blur-md border border-white/10`}><p className="text-xs font-semibold text-white shadow-sm flex items-center gap-1">You {!isMicOn && <MicOff size={10} className="text-red-400" />}</p></div>
          </div>
          
          {/* Remote Video */}
          <div ref={remoteVideoContainerRef} className={`${videoContainerClasses} ${isFullscreen ? 'h-screen rounded-none' : ''} bg-slate-200 dark:bg-slate-700 overflow-hidden relative border border-slate-300 dark:border-slate-600 shadow-sm ring-1 ring-black/5`}>
            <video ref={remoteVideoRef} onDoubleClick={toggleFullscreen} className={`h-full w-full bg-slate-900 object-contain transition-opacity duration-700 ${activeCall.status === "ringing" || (activeCall.status === "accepted" && !isRemoteCameraOn) ? "opacity-0" : "opacity-100"}`} autoPlay playsInline />
            {activeCall.status === "accepted" && !isRemoteCameraOn && !isFullscreen && (<div className="absolute inset-0 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm"><div className="flex flex-col items-center gap-2"><div className={`rounded-full bg-slate-800 ${isVideoCallPage ? 'p-5' : 'p-2'} ring-1 ring-white/10`}><VideoOff size={isVideoCallPage ? 36 : 20} className="text-white/60" /></div>{!isVideoCallPage ? null : <span className="text-white/90 font-medium text-lg">Camera off</span>}</div></div>)}
            {activeCall.status === "ringing" && !isFullscreen && (<div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-md"><div className={`relative mb-2 flex ${isVideoCallPage ? 'h-28 w-28' : 'h-10 w-10'} items-center justify-center rounded-full bg-blue-500/20`}><div className="absolute inset-0 animate-ping rounded-full bg-blue-500/40"></div><div className="absolute inset-2 animate-pulse rounded-full bg-blue-500/30"></div><div className={`rounded-full bg-blue-500/50 ${isVideoCallPage ? 'p-6' : 'p-2'} z-10 ring-1 ring-blue-400/50`}><Phone className="text-blue-100" size={isVideoCallPage ? 40 : 16} /></div></div></div>)}
            {!isFullscreen && <div className={`absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded-lg backdrop-blur-md border border-white/10`}><p className="text-xs font-semibold text-white shadow-sm flex items-center gap-1">{getOtherUserName()} {!isRemoteMicOn && <MicOff size={10} className="text-red-400" />}</p></div>}
            
            {/* Fullscreen toggle button on remote video */}
            {activeCall.status === "accepted" && isRemoteCameraOn && (
              <button onClick={toggleFullscreen} className={`absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/80 transition ${isFullscreen ? 'opacity-0 hover:opacity-100' : 'opacity-70 hover:opacity-100'} backdrop-blur-md border border-white/10 z-50`}>
                <Maximize size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className={`${isVideoCallPage ? 'mt-8 p-5 rounded-3xl border shadow-md' : 'mt-2'} flex flex-col gap-3 bg-white dark:bg-slate-800 dark:border-slate-700`}>
          {mediaError && isVideoCallPage && (<div className="mb-3 p-3 rounded-xl bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800/50"><p className="text-xs font-medium text-red-800 dark:text-red-200 flex items-center gap-2">! {mediaError}</p></div>)}
          
          <div className={`flex ${isVideoCallPage ? 'gap-3 sm:flex-row sm:justify-between' : 'flex-wrap gap-2 justify-center'}`}>
            {isVideoCallPage && (
              <div>
                <p className="font-bold text-lg text-slate-900 dark:text-white">{activeCall.status === "ringing" ? "Call connecting..." : "Call in progress"}</p>
                {activeCall.started_at && activeCall.status === "accepted" && (<p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Started at {new Date(activeCall.started_at).toLocaleTimeString()}</p>)}
              </div>
            )}
            
            <div className={`flex gap-2 ${isVideoCallPage ? 'flex-wrap' : 'w-full justify-center'}`}>
              {!isRingingForCallee && (<>
                <button onClick={toggleScreenShare} className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-white transition-all shadow-sm active:scale-95 ${isScreenSharing ? "bg-blue-500 hover:bg-blue-600" : "bg-slate-700 hover:bg-slate-800 dark:bg-slate-600"}`} title="Share Screen"><Monitor size={16} />{isVideoCallPage && <span className="hidden sm:inline">{isScreenSharing ? "Stop" : "Share"}</span>}</button>
                <button onClick={toggleCamera} className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-white transition-all shadow-sm active:scale-95 ${isCameraOn ? "bg-slate-700 hover:bg-slate-800 dark:bg-slate-600" : "bg-red-500 hover:bg-red-600"}`} title="Toggle Camera">{isCameraOn ? <Video size={16} /> : <VideoOff size={16} />}{isVideoCallPage && <span className="hidden sm:inline">Cam</span>}</button>
                <button onClick={toggleMicrophone} className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-white transition-all shadow-sm active:scale-95 ${isMicOn ? "bg-slate-700 hover:bg-slate-800 dark:bg-slate-600" : "bg-red-500 hover:bg-red-600"}`} title="Toggle Microphone">{isMicOn ? <Mic size={16} /> : <MicOff size={16} />}{isVideoCallPage && <span className="hidden sm:inline">Mic</span>}</button>
              </>)}
              
              {isRingingForCallee ? (
                <div className="flex gap-2 ml-auto">
                  <button onClick={() => acceptTheCall(activeCall.id)} disabled={isCallActionPending} className="flex items-center gap-1.5 rounded-xl bg-green-500 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-green-600 disabled:opacity-70"><Phone size={16} /> {isVideoCallPage && "Accept"}</button>
                  <button onClick={() => rejectTheCall(activeCall.id)} disabled={isCallActionPending} className="flex items-center gap-1.5 rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-red-600 disabled:opacity-70"><PhoneOff size={16} /> {isVideoCallPage && "Reject"}</button>
                </div>
              ) : (
                <button onClick={() => { if (activeCall?.id) endTheCall(activeCall.id); }} disabled={isCallActionPending} className={`flex items-center justify-center gap-1.5 rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-red-600 disabled:opacity-70 ${!isVideoCallPage ? 'flex-1' : 'ml-auto'}`}><PhoneOff size={16} /> {isVideoCallPage ? (activeCall.status === "ringing" ? "Cancel Call" : "End Call") : ""}</button>
              )}
            </div>
          </div>
        </div>
      </div>
    );

    if (isVideoCallPage && portalTarget) {
      return createPortal(ui, portalTarget);
    }
    
    // Fallback if portal not ready, but we are on video page:
    if (isVideoCallPage) {
      return null; // Let it wait for portal to mount
    }

    return ui;
  };

  return (
    <VideoCallContext.Provider value={{ activeCall, isCallActive, isRingingForCallee, isCallActionPending, callUser: (id) => callUser(id), acceptTheCall, rejectTheCall, endTheCall, setPortalTarget }}>
      {children}
      {renderActiveCallUI()}
    </VideoCallContext.Provider>
  );
}
