import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import type { ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  initiateCall, acceptCall, rejectCall, endCall, getActiveCall, type VideoCall
} from "../services/video-call-service";
import { usePeerJS } from "../hooks/use-peerjs";
import { toast } from "sonner";
import { sounds } from "../lib/sounds";

interface VideoCallContextType {
  activeCall: VideoCall | null;
  isCallActive: boolean;
  isRingingForCallee: boolean;
  isCallActionPending: boolean;
  currentUserId: number | null;
  currentUserName: string;
  
  // Media streams & settings
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isCameraOn: boolean;
  isMicOn: boolean;
  isScreenSharing: boolean;
  isRemoteCameraOn: boolean;
  isRemoteMicOn: boolean;
  isRemoteScreenSharing: boolean;
  
  // Layout states
  isFullscreen: boolean;
  setIsFullscreen: (val: boolean | ((prev: boolean) => boolean)) => void;

  // Actions
  callUser: (userId: number) => void;
  acceptTheCall: (callId: number) => void;
  rejectTheCall: (callId: number) => void;
  endTheCall: (callId: number) => void;
  toggleCamera: () => void;
  toggleMic: () => void;
  shareScreen: () => void;
  stopScreenShare: () => void;
}

const VideoCallContext = createContext<VideoCallContextType | null>(null);

export function useVideoCall() {
  const context = useContext(VideoCallContext);
  if (!context) throw new Error("useVideoCall must be used within a VideoCallProvider");
  return context;
}

export function VideoCallProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserName, setCurrentUserName] = useState("User");
  
  // Remote participant states
  const [isRemoteCameraOn, setIsRemoteCameraOn] = useState(false);
  const [isRemoteMicOn, setIsRemoteMicOn] = useState(false);
  const [isRemoteScreenSharing, setIsRemoteScreenSharing] = useState(false);
  
  // Active call state models
  const [activeCallState, setActiveCallState] = useState<VideoCall | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const lastPolledStatusRef = useRef<string | null>(null);
  const lastPolledCallIdRef = useRef<number | null>(null);
  const recentlyRejectedCallIdRef = useRef<number | null>(null);

  // Tracks whether this is the first poll after a page load/refresh.
  // Used to detect and auto-end ghost calls whose PeerJS connection was lost on reload.
  const isPageFreshLoadRef = useRef(true);

  // Stable ref for stopAllMedia to prevent circular dependency closures
  const stopAllMediaRef = useRef<() => void>(() => {});

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUserId(user.id ? Number(user.id) : null);
    setCurrentUserName(user.name || "User");
  }, []);

  // ── PeerJS Callbacks ──
  const handleRemoteStream = useCallback((stream: MediaStream) => {
    console.log("[VideoCallContext] Remote stream set in state");
    setRemoteStream(stream);
  }, []);

  const handleCallEnded = useCallback(() => {
    console.log("[VideoCallContext] Media call ended");
    stopAllMediaRef.current();
    sounds.stopRinging();
    setActiveCallState(null);
    setRemoteStream(null);
    setIsFullscreen(false);
    
    // Reset all remote media states on call end
    setIsRemoteCameraOn(false);
    setIsRemoteMicOn(false);
    setIsRemoteScreenSharing(false);

    // ── Prevent poll re-activation ──
    // Do NOT null out the refs here. Instead stamp the last known call as 'ended'
    // so the next 1-second poll sees (sameId, 'ended') and short-circuits immediately.
    // Also lock recentlyRejectedCallIdRef for 3 s as a second line of defence.
    lastPolledStatusRef.current = 'ended';
    if (lastPolledCallIdRef.current) {
      recentlyRejectedCallIdRef.current = lastPolledCallIdRef.current;
      setTimeout(() => {
        recentlyRejectedCallIdRef.current = null;
      }, 3000);
    }

    queryClient.invalidateQueries({ queryKey: ["active-call"] });
  }, [queryClient]);

  const handleDataMessage = useCallback((data: any) => {
    if (data.type === "CAMERA") setIsRemoteCameraOn(data.value);
    else if (data.type === "MIC") setIsRemoteMicOn(data.value);
    else if (data.type === "SCREEN_SHARE") setIsRemoteScreenSharing(data.value);
    else if (data.type === "END_CALL") {
      console.log("[VideoCallContext] END_CALL command received via data channel");
      handleCallEnded();
    }
  }, [handleCallEnded]);

  const handleCallReceived = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["active-call"] });
    sounds.startRinging();
  }, [queryClient]);

  const {
    localStream, isCameraOn, isMicOn, isScreenSharing,
    startLocalStream,
    makeCall,
    answerIncomingCall, stopAllMedia,
    toggleCamera, toggleMic, shareScreen, stopScreenShare,
  } = usePeerJS({
    userId: currentUserId,
    onRemoteStream: handleRemoteStream,
    onDataMessage: handleDataMessage,
    onCallReceived: handleCallReceived,
    onCallEnded: handleCallEnded,
  });

  useEffect(() => {
    stopAllMediaRef.current = stopAllMedia;
  }, [stopAllMedia]);

  // ── API Mutations ──
  const { mutate: callUser, isPending: isCallingPending } = useMutation({
    mutationFn: initiateCall,
    onMutate: async (calleeId) => {
      // If there's an active call already, terminate it before starting a new one
      if (activeCallState && activeCallState.status !== 'ended' && activeCallState.status !== 'rejected') {
        console.log("[VideoCallContext] Automatically ending previous active call");
        try {
          await endCall(activeCallState.id);
        } catch (err) {
          console.warn("[VideoCallContext] End call error:", err);
        }
        stopAllMedia();
        setActiveCallState(null);
        setRemoteStream(null);
      }

      // Optimistic Update: Instantly open calling overlay panel and acquire media
      const contacts = queryClient.getQueryData<any[]>(["meeting-contacts"]) || [];
      const callee = contacts.find(c => Number(c.id) === Number(calleeId));

      const optimisticCall: VideoCall = {
        id: Date.now(),
        caller_id: currentUserId || 0,
        callee_id: calleeId,
        status: 'ringing',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        callee: callee ? { id: callee.id, name: callee.name, email: callee.email } : undefined,
        caller: { id: currentUserId || 0, name: currentUserName, email: "" }
      };

      setActiveCallState(optimisticCall);
      startLocalStream(false, true);
    },
    onSuccess: (data) => { 
      queryClient.setQueryData(["active-call"], data);
      queryClient.invalidateQueries({ queryKey: ["active-call"] }); 
      if (data) {
        setActiveCallState(data);
        lastPolledCallIdRef.current = data.id;
        lastPolledStatusRef.current = data.status;
        makeCall(data.callee_id);
      }
    },
    onError: (err) => { 
      console.error("Call initiation error:", err);
      toast.error("Failed to initiate call"); 
      setIsRemoteCameraOn(false);
      setIsRemoteMicOn(false);
      setIsRemoteScreenSharing(false);
      queryClient.setQueryData(["active-call"], null); 
      stopAllMedia(); 
    },
  });

  const { mutate: acceptTheCall, isPending: isAcceptPending } = useMutation({
    mutationFn: acceptCall,
    onMutate: async () => {
      console.log("[VideoCallContext] Accepting incoming call (optimistic)...");
      sounds.stopRinging();
      setActiveCallState((prev) => prev ? { ...prev, status: "accepted" } : null);
      answerIncomingCall();
    },
    onSuccess: (data) => {
      if (data) {
        setActiveCallState(data);
        lastPolledCallIdRef.current = data.id;
        lastPolledStatusRef.current = data.status;
      }
      queryClient.invalidateQueries({ queryKey: ["active-call"] });
    },
    onError: (err: any) => {
      console.error("[VideoCallContext] Accept call error:", err);
      toast.error(err?.response?.data?.message || "Failed to accept call");
      stopAllMedia();
      setActiveCallState(null);
      setRemoteStream(null);
      setIsRemoteCameraOn(false);
      setIsRemoteMicOn(false);
      setIsRemoteScreenSharing(false);
      queryClient.invalidateQueries({ queryKey: ["active-call"] });
    },
  });

  const { mutate: rejectTheCall, isPending: isRejectPending } = useMutation({
    mutationFn: rejectCall,
    onMutate: () => {
      console.log("[VideoCallContext] Rejecting incoming call...");
      stopAllMedia();
      sounds.stopRinging();
      setActiveCallState(null);
      setRemoteStream(null);
      setIsFullscreen(false);
      
      // Reset all remote media states on reject
      setIsRemoteCameraOn(false);
      setIsRemoteMicOn(false);
      setIsRemoteScreenSharing(false);
      
      if (activeCallState?.id) {
        recentlyRejectedCallIdRef.current = activeCallState.id;
      }
    },
    onSuccess: (data) => {
      if (data) {
        lastPolledCallIdRef.current = data.id;
        lastPolledStatusRef.current = 'rejected';
      }
      queryClient.invalidateQueries({ queryKey: ["active-call"] });
      
      setTimeout(() => {
        recentlyRejectedCallIdRef.current = null;
      }, 2000);
    },
    onError: (err: any) => {
      console.error("[VideoCallContext] Reject call error:", err);
      toast.error(err?.response?.data?.message || "Failed to decline call");
      setIsRemoteCameraOn(false);
      setIsRemoteMicOn(false);
      setIsRemoteScreenSharing(false);
      queryClient.invalidateQueries({ queryKey: ["active-call"] });
      
      setTimeout(() => {
        recentlyRejectedCallIdRef.current = null;
      }, 2000);
    },
  });

  const { mutate: endTheCall, isPending: isEndPending } = useMutation({
    mutationFn: endCall,
    onMutate: () => {
      console.log("[VideoCallContext] Ending ongoing call...");
      stopAllMedia();
      setActiveCallState(null);
      setRemoteStream(null);
      setIsFullscreen(false);
      
      // Reset all remote media states on end
      setIsRemoteCameraOn(false);
      setIsRemoteMicOn(false);
      setIsRemoteScreenSharing(false);
      
      if (activeCallState?.id) {
        recentlyRejectedCallIdRef.current = activeCallState.id;
      }
    },
    onSuccess: (data) => {
      if (data) {
        lastPolledCallIdRef.current = data.id;
        lastPolledStatusRef.current = 'ended';
      }
      queryClient.invalidateQueries({ queryKey: ["active-call"] });
      
      setTimeout(() => {
        recentlyRejectedCallIdRef.current = null;
      }, 2000);
    },
    onError: (err: any) => {
      console.error("[VideoCallContext] End call error:", err);
      toast.error(err?.response?.data?.message || "Failed to end call");
      setIsRemoteCameraOn(false);
      setIsRemoteMicOn(false);
      setIsRemoteScreenSharing(false);
      queryClient.invalidateQueries({ queryKey: ["active-call"] });
      
      setTimeout(() => {
        recentlyRejectedCallIdRef.current = null;
      }, 2000);
    },
  });

  // ── Polling ──
  // Fast 1 second polling interval for responsive, instant calls
  const { data: polledCall } = useQuery({
    queryKey: ["active-call"],
    queryFn: getActiveCall,
    refetchInterval: 1000,
    enabled: !!currentUserId,
  });

  // ── Sync polled state → local state ──
  useEffect(() => {
    if (polledCall === undefined) return;

    // Prevent background polling from overwriting during user operations
    if (isEndPending || isRejectPending || isCallingPending || isAcceptPending) return;

    const callId = polledCall?.id ?? null;
    const status = polledCall?.status ?? null;

    // ── Page Refresh Guard ──
    // On the very first poll after a page load/refresh, the PeerJS WebRTC connection
    // has been destroyed. Any call that requires an active WebRTC connection (accepted
    // or ringing-as-caller) is a ghost call and must be ended immediately.
    // Exception: if the user is the CALLEE of a ringing call, preserve it so they can
    // still accept or decline normally.
    if (isPageFreshLoadRef.current && currentUserId !== null) {
      isPageFreshLoadRef.current = false;

      if (polledCall && status !== 'ended' && status !== 'rejected') {
        const isIncomingRingForCallee =
          status === 'ringing' && polledCall.callee_id === currentUserId;

        if (!isIncomingRingForCallee) {
          // Ghost call detected – auto-end it silently, no UI shown
          console.log('[VideoCallContext] Page refresh detected with orphaned call (id:', callId, ', status:', status, ') – auto-ending.');
          endCall(polledCall.id).catch(() => {});
          lastPolledCallIdRef.current = callId;
          lastPolledStatusRef.current = 'ended';
          return;
        }
      }
    }

    if (callId === recentlyRejectedCallIdRef.current) return;
    if (callId === lastPolledCallIdRef.current && status === lastPolledStatusRef.current) return;

    // If already in an accepted call, ignore any new incoming ringing calls.
    // The caller will hear a busy/no-answer and the backend auto-expires them.
    if (activeCallState?.status === 'accepted' && status === 'ringing' && callId !== activeCallState.id) {
      return;
    }

    // If in any active call (ringing/accepted), ignore different incoming calls
    if (activeCallState && callId !== activeCallState.id && (status === 'ringing' || status === 'accepted')) {
      return;
    }

    // ── Ghost-accepted guard ──
    // If activeCallState is already null (call was cleaned up) but the poll still
    // returns an 'accepted' record (stale DB / timing race), do NOT re-open the UI.
    // This prevents the call overlay from blinking back after handleCallEnded ran.
    if (!activeCallState && status === 'accepted') {
      return;
    }

    lastPolledCallIdRef.current = callId;
    lastPolledStatusRef.current = status;

    if (!polledCall || status === "ended" || status === "rejected") {
      if (activeCallState) {
        stopAllMedia();
        sounds.stopRinging();
        if (status === "rejected" || activeCallState.status === "ringing") {
          toast.error("Call Declined");
        } else {
          toast.info("Call Ended");
        }
        setActiveCallState(null);
        setRemoteStream(null);
        setIsFullscreen(false);
      }
      return;
    }

    if (activeCallState && activeCallState.id !== callId && activeCallState.status === 'ringing') {
      return;
    }

    setActiveCallState(polledCall);

    if (status === "ringing" && polledCall.callee_id === currentUserId) {
      sounds.startRinging();
    }
    if (status === "accepted") {
      sounds.stopRinging();
    }
  }, [polledCall, currentUserId, activeCallState, stopAllMedia, isEndPending, isRejectPending, isCallingPending, isAcceptPending]);

  const isCallActive        = !!activeCallState;
  const isRingingForCallee  = activeCallState?.status === "ringing" && activeCallState?.callee_id === currentUserId;
  const isCallActionPending = isCallingPending || isAcceptPending || isRejectPending || isEndPending;

  return (
    <VideoCallContext.Provider value={{
      activeCall: activeCallState,
      isCallActive,
      isRingingForCallee,
      isCallActionPending,
      currentUserId,
      currentUserName,
      
      localStream,
      remoteStream,
      isCameraOn,
      isMicOn,
      isScreenSharing,
      isRemoteCameraOn,
      isRemoteMicOn,
      isRemoteScreenSharing,
      
      isFullscreen,
      setIsFullscreen,

      callUser,
      acceptTheCall,
      rejectTheCall,
      endTheCall,
      toggleCamera,
      toggleMic,
      shareScreen,
      stopScreenShare,
    }}>
      {children}
    </VideoCallContext.Provider>
  );
}
