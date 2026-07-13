import { useEffect, useState, useRef, useCallback } from "react";
import Peer from "peerjs";
import { toast } from "sonner";

interface UsePeerJSOptions {
  userId: number | null;
  onRemoteStream: (stream: MediaStream) => void;
  onDataMessage: (data: any) => void;
  onCallReceived: () => void;
  onCallEnded: () => void;
}

export function usePeerJS({ userId, onRemoteStream, onDataMessage, onCallReceived, onCallEnded }: UsePeerJSOptions) {
  const [isPeerReady, setIsPeerReady] = useState(false);
  
  // Refs to manage WebRTC elements and streams cleanly
  const peerRef = useRef<Peer | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const currentCallRef = useRef<any>(null);
  const dataConnRef = useRef<any>(null);
  const pendingAcceptRef = useRef(false);
  
  // Active promise cache to prevent concurrent duplicate getUserMedia requests
  const localStreamPromiseRef = useRef<Promise<MediaStream | null> | null>(null);

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  // Maintain stable refs for callbacks to prevent stale closures in event listeners
  const onRemoteStreamRef = useRef(onRemoteStream);
  const onDataMessageRef  = useRef(onDataMessage);
  const onCallReceivedRef = useRef(onCallReceived);
  const onCallEndedRef    = useRef(onCallEnded);
  
  useEffect(() => { onRemoteStreamRef.current = onRemoteStream; }, [onRemoteStream]);
  useEffect(() => { onDataMessageRef.current  = onDataMessage;  }, [onDataMessage]);
  useEffect(() => { onCallReceivedRef.current = onCallReceived; }, [onCallReceived]);
  useEffect(() => { onCallEndedRef.current    = onCallEnded;    }, [onCallEnded]);

  // Guard to ensure onCallEnded callback triggers exactly once per call lifecycle
  const callEndedFiredRef = useRef(false);
  const safeCallEnded = useCallback(() => {
    if (callEndedFiredRef.current) return;
    callEndedFiredRef.current = true;
    onCallEndedRef.current();
  }, []);

  // Guard to prevent accepting multiple calls during acceptance window
  const isAcceptingCallRef = useRef(false);

  // Initialize PeerJS client instance
  useEffect(() => {
    if (!userId) return;
    
    const peerId = `mhflow-user-${userId}`;
    const newPeer = new Peer(peerId, {
      debug: 1,
      config: { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] }
    });
    
    peerRef.current = newPeer;

    newPeer.on("open", () => {
      console.log("[PeerJS] Connected to signaling server with ID:", peerId);
      setIsPeerReady(true);
    });
    newPeer.on("call", (call) => {
      console.log("[PeerJS] Incoming media call received");
      
      if (pendingAcceptRef.current) {
        console.log("[PeerJS] Answering pre-accepted incoming call");
        pendingAcceptRef.current = false;
        currentCallRef.current = call;
        callEndedFiredRef.current = false;

        call.on("stream", (remote) => {
          console.log("[PeerJS] Remote media stream attached (pre-accepted)");
          onRemoteStreamRef.current(remote);
          setTimeout(() => {
            syncMediaState();
            if (dataConnRef.current && dataConnRef.current.open) {
              dataConnRef.current.send({ type: "REQUEST_STATE" });
            }
          }, 100);
        });
        call.on("close", () => {
          console.log("[PeerJS] Pre-accepted call closed");
          safeCallEnded();
        });
        call.on("error", (err) => {
          console.error("[PeerJS] Pre-accepted call error:", err);
          currentCallRef.current = null;
          safeCallEnded();
        });

        startLocalStream().then((stream) => {
          call.answer(stream || undefined);
          setTimeout(syncMediaState, 500);
        });
        return;
      }

      // Prevent duplicate call overlay/ringtone if already in an active call or accepting one
      if (currentCallRef.current || localStreamRef.current || isAcceptingCallRef.current) {
        console.log("[PeerJS] Already in an active call or accepting, declining incoming call request");
        call.answer(); // Answer with no stream (equivalent to declining)
        call.close();
        return;
      }

      currentCallRef.current = call;
      callEndedFiredRef.current = false;

      call.on("stream", (remote) => {
        console.log("[PeerJS] Remote media stream attached");
        isAcceptingCallRef.current = false; // Clear flag once stream is established
        onRemoteStreamRef.current(remote);
        // Sync media state after remote stream established to ensure state is received
        setTimeout(() => {
          syncMediaState();
          // Also request remote's current state
          if (dataConnRef.current && dataConnRef.current.open) {
            dataConnRef.current.send({ type: "REQUEST_STATE" });
          }
        }, 100);
      });
      call.on("close", () => {
        console.log("[PeerJS] Call closed");
        isAcceptingCallRef.current = false;
        safeCallEnded();
      });
      call.on("error", (err) => {
        console.error("[PeerJS] Call error occurred:", err);
        isAcceptingCallRef.current = false;
        currentCallRef.current = null;
        safeCallEnded();
      });

      onCallReceivedRef.current();
    });

    newPeer.on("connection", (conn) => {
      dataConnRef.current = conn;
      conn.on("open", () => {
        console.log("[PeerJS] Data channel connection opened, syncing local states...");
        const videoTrack = localStreamRef.current?.getVideoTracks()[0];
        const audioTrack = localStreamRef.current?.getAudioTracks()[0];
        // Send current state immediately and again after small delay for reliability
        conn.send({ type: "CAMERA", value: !!videoTrack?.enabled });
        conn.send({ type: "MIC", value: !!audioTrack?.enabled });
        setTimeout(() => {
          conn.send({ type: "CAMERA", value: !!videoTrack?.enabled });
          conn.send({ type: "MIC", value: !!audioTrack?.enabled });
        }, 100);
      });
      conn.on("data", (data) => {
        // Handle state request by sending current state back
        if ((data as any)?.type === "REQUEST_STATE") {
          const videoTrack = localStreamRef.current?.getVideoTracks()[0];
          const audioTrack = localStreamRef.current?.getAudioTracks()[0];
          conn.send({ type: "CAMERA", value: !!videoTrack?.enabled });
          conn.send({ type: "MIC", value: !!audioTrack?.enabled });
        } else {
          onDataMessageRef.current(data);
        }
      });
      conn.on("close", () => console.log("[PeerJS] Data channel closed"));
    });

    newPeer.on("error", (err) => {
      console.error("[PeerJS] General error occurred:", err);
      if (err.type === "peer-unavailable") {
        toast.error("The other user is currently offline");
      }
    });

    newPeer.on("disconnected", () => {
      console.log("[PeerJS] Disconnected from signaling server. Attempting reconnect...");
      if (!newPeer.destroyed) newPeer.reconnect();
    });

    return () => {
      console.log("[PeerJS] Destroying Peer instance...");
      newPeer.destroy();
      peerRef.current = null;
      setIsPeerReady(false);
    };
  }, [userId, safeCallEnded]);

  // Acquire local media streams with protection against duplicate concurrent requests
  const startLocalStream = useCallback(async (withVideo = false, withAudio = true) => {
    // If stream is already active, return it immediately
    if (localStreamRef.current && localStreamRef.current.active) {
      return localStreamRef.current;
    }
    
    // If a request is already in progress, return the existing promise
    if (localStreamPromiseRef.current) {
      console.log("[PeerJS] Awaiting active local stream acquisition request...");
      return localStreamPromiseRef.current;
    }

    console.log("[PeerJS] Acquiring local camera and microphone stream...");
    const promise = (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        stream.getVideoTracks().forEach(t => (t.enabled = withVideo));
        stream.getAudioTracks().forEach(t => (t.enabled = withAudio));
        
        localStreamRef.current = stream;
        setLocalStream(stream);
        setIsCameraOn(withVideo);
        setIsMicOn(withAudio);
        return stream;
      } catch (err) {
        console.error("[PeerJS] Media access failed:", err);
        toast.error("Could not access camera or microphone.");
        return null;
      } finally {
        // Clear active promise ref once complete
        localStreamPromiseRef.current = null;
      }
    })();

    localStreamPromiseRef.current = promise;
    return promise;
  }, []);

  // Stop all active media streams and close connections cleanly
  const stopAllMedia = useCallback(() => {
    console.log("[PeerJS] Terminating all active streams and connections...");
    
    isAcceptingCallRef.current = false;
    pendingAcceptRef.current = false;
    
    // Send explicit end call notification via data channel for instant remote updates
    if (dataConnRef.current && dataConnRef.current.open) {
      dataConnRef.current.send({ type: "END_CALL" });
    }

    // Stop local camera/mic stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => {
        t.stop();
        console.log("[PeerJS] Stopped track:", t.label);
      });
      localStreamRef.current = null;
      setLocalStream(null);
    }

    // Stop local screen sharing stream tracks
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => {
        t.stop();
        console.log("[PeerJS] Stopped screen sharing track:", t.label);
      });
      screenStreamRef.current = null;
    }

    // Close and clean PeerJS call object
    if (currentCallRef.current) {
      currentCallRef.current.close();
      currentCallRef.current = null;
    }
    
    // Close data channel with small delay to allow END_CALL message delivery
    setTimeout(() => {
      if (dataConnRef.current) {
        dataConnRef.current.close();
        dataConnRef.current = null;
      }
    }, 100);

    setIsCameraOn(false);
    setIsMicOn(false);
    setIsScreenSharing(false);
    localStreamPromiseRef.current = null;
  }, []);

  const syncMediaState = useCallback(() => {
    if (dataConnRef.current && dataConnRef.current.open && localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      dataConnRef.current.send({ type: "CAMERA", value: !!videoTrack?.enabled });
      dataConnRef.current.send({ type: "MIC", value: !!audioTrack?.enabled });
    }
  }, []);

  // Initiate an outgoing call
  const makeCall = useCallback(async (targetId: number) => {
    if (!peerRef.current) {
      toast.error("Video system is not initialized. Please try again.");
      return;
    }

    // Await signaling channel activation if needed
    if (!peerRef.current.open) {
      toast.info("Connecting to video server...");
      await new Promise<void>((resolve) => {
        const checkOpen = setInterval(() => {
          if (peerRef.current?.open) {
            clearInterval(checkOpen);
            resolve();
          }
        }, 200);
        setTimeout(() => {
          clearInterval(checkOpen);
          resolve();
        }, 10000);
      });
      
      if (!peerRef.current.open) {
        toast.error("Failed to connect to video server. Please try again.");
        return;
      }
    }

    callEndedFiredRef.current = false;
    const stream = await startLocalStream();
    if (!stream) return;

    const targetPeerId = `mhflow-user-${targetId}`;
    console.log("[PeerJS] Initiating call and data channel to:", targetPeerId);

    // Open data channel
    const conn = peerRef.current.connect(targetPeerId);
    dataConnRef.current = conn;
    conn.on("open", () => {
      console.log("[PeerJS] Outbound data connection opened, syncing local states...");
      const videoTrack = localStreamRef.current?.getVideoTracks()[0];
      const audioTrack = localStreamRef.current?.getAudioTracks()[0];
      conn.send({ type: "CAMERA", value: !!videoTrack?.enabled });
      conn.send({ type: "MIC", value: !!audioTrack?.enabled });
      // Resend after delay for reliability
      setTimeout(() => {
        conn.send({ type: "CAMERA", value: !!videoTrack?.enabled });
        conn.send({ type: "MIC", value: !!audioTrack?.enabled });
      }, 100);
    });
    conn.on("data", (data) => {
      // Handle state request by sending current state back
      if ((data as any)?.type === "REQUEST_STATE") {
        const videoTrack = localStreamRef.current?.getVideoTracks()[0];
        const audioTrack = localStreamRef.current?.getAudioTracks()[0];
        conn.send({ type: "CAMERA", value: !!videoTrack?.enabled });
        conn.send({ type: "MIC", value: !!audioTrack?.enabled });
      } else {
        onDataMessageRef.current(data);
      }
    });
    conn.on("close", () => console.log("[PeerJS] Data channel closed"));

    // Call media channel
    const call = peerRef.current.call(targetPeerId, stream);
    currentCallRef.current = call;
    
    call.on("stream", (remote) => {
      console.log("[PeerJS] Remote stream attached (outbound call)");
      onRemoteStreamRef.current(remote);
      // Sync media state when remote stream arrives to confirm state to callee
      setTimeout(() => {
        syncMediaState();
      }, 100);
    });
    call.on("close", () => {
      console.log("[PeerJS] Outbound call closed, cleaning up...");
      currentCallRef.current = null;
      safeCallEnded();
    });
    call.on("error", (err) => {
      console.error("[PeerJS] Outbound call error:", err);
      currentCallRef.current = null;
      safeCallEnded();
    });
  }, [startLocalStream, safeCallEnded, syncMediaState]);

  // Answer an incoming call
  const answerIncomingCall = useCallback(async () => {
    if (!currentCallRef.current) {
      console.log("[PeerJS] Answer clicked before media call arrived, flagging pending accept");
      pendingAcceptRef.current = true;
      isAcceptingCallRef.current = false;
      return;
    }
    try {
      isAcceptingCallRef.current = true;
      console.log("[PeerJS] Answering incoming media call...");
      const stream = await startLocalStream();
      currentCallRef.current.answer(stream || undefined);
      
      setTimeout(syncMediaState, 500);
      // Flag cleared when remote stream arrives or on error in the call event handlers
    } catch (err) {
      console.error("[PeerJS] Error answering call:", err);
      isAcceptingCallRef.current = false;
    }
  }, [startLocalStream, syncMediaState]);

  const toggleCamera = useCallback(() => {
    if (!localStreamRef.current) return;
    const track = localStreamRef.current.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsCameraOn(track.enabled);
      if (dataConnRef.current && dataConnRef.current.open) {
        dataConnRef.current.send({ type: "CAMERA", value: track.enabled });
      }
    }
  }, []);

  const toggleMic = useCallback(() => {
    if (!localStreamRef.current) return;
    const track = localStreamRef.current.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsMicOn(track.enabled);
      if (dataConnRef.current && dataConnRef.current.open) {
        dataConnRef.current.send({ type: "MIC", value: track.enabled });
      }
    }
  }, []);

  // Share screen track by swapping outgoing PeerJS video sender track
  const shareScreen = useCallback(async () => {
    if (!currentCallRef.current || !localStreamRef.current) {
      toast.error("No active call available for screen sharing.");
      return;
    }
    
    try {
      console.log("[PeerJS] Requesting screen sharing display media...");
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = screenStream;
      const screenTrack = screenStream.getVideoTracks()[0];

      const sender = (currentCallRef.current.peerConnection as RTCPeerConnection)
        ?.getSenders()
        .find((s: RTCRtpSender) => s.track?.kind === "video");
        
      if (sender) {
        await sender.replaceTrack(screenTrack);
        console.log("[PeerJS] Swapped outgoing video track to Screen Share");
      }

      setIsScreenSharing(true);
      dataConnRef.current?.send({ type: "SCREEN_SHARE", value: true });

      // When browser's native stop sharing banner is clicked
      screenTrack.onended = async () => {
        console.log("[PeerJS] Screen share track ended natively by browser banner");
        const cameraTrack = localStreamRef.current?.getVideoTracks()[0] ?? null;
        if (sender && cameraTrack) {
          await sender.replaceTrack(cameraTrack);
          console.log("[PeerJS] Restored outgoing track to Camera");
        }
        setIsScreenSharing(false);
        screenStreamRef.current = null;
        dataConnRef.current?.send({ type: "SCREEN_SHARE", value: false });
      };
    } catch (err: any) {
      if (err.name !== "NotAllowedError") {
        console.error("[PeerJS] Screen share failed:", err);
        toast.error("Could not access screen sharing stream.");
      }
    }
  }, []);

  // Programmatically stop screen sharing and restore camera
  const stopScreenShare = useCallback(async () => {
    if (!currentCallRef.current || !localStreamRef.current) return;
    console.log("[PeerJS] Programmatically stopping screen share...");

    // Stop screen share tracks explicitly so the native browser sharing banner closes
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }

    const cameraTrack = localStreamRef.current.getVideoTracks()[0];
    const sender = (currentCallRef.current.peerConnection as RTCPeerConnection)
      ?.getSenders()
      .find((s: RTCRtpSender) => s.track?.kind === "video");
      
    if (sender && cameraTrack) {
      await sender.replaceTrack(cameraTrack);
      console.log("[PeerJS] Restored outgoing track to Camera");
    }
    
    setIsScreenSharing(false);
    dataConnRef.current?.send({ type: "SCREEN_SHARE", value: false });
  }, []);

  return {
    isPeerReady,
    localStreamRef,
    localStream,
    isCameraOn,
    isMicOn,
    isScreenSharing,
    startLocalStream,
    makeCall,
    answerIncomingCall,
    stopAllMedia,
    toggleCamera,
    toggleMic,
    shareScreen,
    stopScreenShare,
  };
}
