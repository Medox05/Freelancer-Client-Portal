import { useEffect, useState, useRef, useCallback } from "react";
import Peer from "peerjs";

interface UsePeerJSOptions {
  userId: number | null;
  onRemoteStream: (stream: MediaStream) => void;
  onDataMessage: (data: any) => void;
  onCallReceived: () => void;
}

export function usePeerJS({ userId, onRemoteStream, onDataMessage, onCallReceived }: UsePeerJSOptions) {
  const [peer, setPeer] = useState<Peer | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const currentCallRef = useRef<any>(null);
  const dataConnRef = useRef<any>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const originalVideoTrackRef = useRef<MediaStreamTrack | null>(null);
  const activeMediaRequestRef = useRef<number>(0);

  // Initialize PeerJS
  useEffect(() => {
    if (!userId) return;
    
    const newPeer = new Peer(`mhflow-user-${userId}`, {
      debug: 0,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun3.l.google.com:19302" },
          { urls: "stun:stun4.l.google.com:19302" },
          {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject",
          },
          {
            urls: "turn:openrelay.metered.ca:443",
            username: "openrelayproject",
            credential: "openrelayproject",
          },
        ],
      },
    });

    const timeoutId = setTimeout(() => {
      if (!newPeer._open) {
        console.warn("PeerJS initialization timeout");
        setMediaError("Connection taking too long. Please refresh and try again.");
      }
    }, 10000);

    newPeer.on("open", () => {
      clearTimeout(timeoutId);
      setPeer(newPeer);
      setMediaError(null);
      console.log("PeerJS connected:", newPeer.id);
    });

    newPeer.on("call", (call) => {
      currentCallRef.current = call;
      onCallReceived();
    });

    newPeer.on("connection", (conn) => {
      setupDataConnection(conn);
    });

    newPeer.on("error", (err: any) => {
      clearTimeout(timeoutId);
      console.error("PeerJS Error:", err.type, err.message);
      if (err.type === "unavailable-id") {
        setMediaError("Failed to connect. Please refresh the page.");
      } else if (err.type === "peer-unavailable") {
        setMediaError("The other user is not available.");
      } else if (err.type === "network") {
        setMediaError("Network error. Check your connection.");
      } else if (err.type === "server-error") {
        setMediaError("PeerJS server error. Please try again later.");
      } else {
        setMediaError(`Connection error: ${err.message || err.type}. Please refresh.`);
      }
    });

    return () => {
      clearTimeout(timeoutId);
      newPeer.destroy();
      setPeer(null);
    };
  }, [userId]);

  const setupDataConnection = useCallback((conn: any) => {
    dataConnRef.current = conn;
    conn.on("data", (data: any) => onDataMessage(data));
  }, [onDataMessage]);

  const startMediaStream = useCallback(async () => {
    const requestId = ++activeMediaRequestRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      
      // If a stop was requested while waiting for permissions, drop the stream immediately
      if (requestId !== activeMediaRequestRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return null;
      }

      // Disable camera and mic by default
      stream.getVideoTracks().forEach((t) => t.enabled = false);
      stream.getAudioTracks().forEach((t) => t.enabled = false);

      localStreamRef.current = stream;
      setMediaError(null);
      setIsCameraOn(false);
      setIsMicOn(false);
      return stream;
    } catch (err: any) {
      const msg = err.name === "NotAllowedError"
        ? "Camera/mic access denied. Please allow access in browser settings."
        : err.name === "NotReadableError"
          ? "Camera/mic is in use by another application."
          : "Could not access camera/microphone.";
      setMediaError(msg);
      return null;
    }
  }, []);

  const stopMediaStream = useCallback(() => {
    activeMediaRequestRef.current++; // Invalidate any pending camera requests
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (currentCallRef.current) {
      currentCallRef.current.close();
      currentCallRef.current = null;
    }
    if (dataConnRef.current) {
      dataConnRef.current.close();
      dataConnRef.current = null;
    }
    if (originalVideoTrackRef.current) {
      originalVideoTrackRef.current.stop();
      originalVideoTrackRef.current = null;
    }
    setIsScreenSharing(false);
  }, []);

  const callPeer = useCallback(async (calleeUserId: number) => {
    if (!peer) {
      const msg = mediaError || "PeerJS not ready. Please refresh the page and wait for connection.";
      setMediaError(msg);
      return;
    }
    const stream = await startMediaStream();
    if (!stream) return;
    
    try {
      const peerId = `mhflow-user-${calleeUserId}`;
      // Open data connection
      const conn = peer.connect(peerId);
      setupDataConnection(conn);
      
      // If we have a stream, call with video
      const call = peer.call(peerId, stream);
      if (!call) {
        setMediaError("Failed to initiate call. Please try again.");
        return;
      }
      currentCallRef.current = call;
      call.on("stream", (remoteStream: MediaStream) => onRemoteStream(remoteStream));
      call.on("error", (err) => {
        console.error("Call error:", err);
        setMediaError("Call connection failed. Please try again.");
      });
      call.on("close", () => stopMediaStream());
    } catch (err) {
      console.error("callPeer error:", err);
      setMediaError("Failed to start call. Please try again.");
      stopMediaStream();
    }
  }, [peer, mediaError, startMediaStream, stopMediaStream, onRemoteStream, setupDataConnection]);

  const answerCall = useCallback(async () => {
    if (!currentCallRef.current) return;
    const stream = await startMediaStream();
    if (stream) {
      currentCallRef.current.answer(stream);
    } else {
      currentCallRef.current.answer();
    }
    currentCallRef.current.on("stream", (remoteStream: MediaStream) => onRemoteStream(remoteStream));
    currentCallRef.current.on("close", () => stopMediaStream());
    
    // Wait for data connection to be established before sending acceptance signal
    setTimeout(() => {
      if (dataConnRef.current?.open) {
        dataConnRef.current.send({ type: "CALL_ACCEPTED" });
      }
    }, 500);
  }, [startMediaStream, stopMediaStream, onRemoteStream]);

  const toggleCamera = useCallback(() => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraOn(videoTrack.enabled);
      if (dataConnRef.current?.open) {
        dataConnRef.current.send({ type: "CAMERA", value: videoTrack.enabled });
      }
    }
  }, []);

  const toggleMicrophone = useCallback(() => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicOn(audioTrack.enabled);
      if (dataConnRef.current?.open) {
        dataConnRef.current.send({ type: "MIC", value: audioTrack.enabled });
      }
    }
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (!currentCallRef.current || !localStreamRef.current) return;

    if (isScreenSharing) {
      // Stop screen sharing
      const senders = currentCallRef.current.peerConnection?.getSenders() || [];
      const videoSender = senders.find((s: any) => s.track?.kind === "video");
      
      if (originalVideoTrackRef.current && videoSender) {
        await videoSender.replaceTrack(originalVideoTrackRef.current);
        
        // Revert local stream track
        const screenTrack = localStreamRef.current.getVideoTracks()[0];
        if (screenTrack) {
          localStreamRef.current.removeTrack(screenTrack);
          screenTrack.stop();
        }
        localStreamRef.current.addTrack(originalVideoTrackRef.current);
        
        setIsScreenSharing(false);
        setIsCameraOn(originalVideoTrackRef.current.enabled);
        
        if (dataConnRef.current?.open) {
          dataConnRef.current.send({ type: "CAMERA", value: originalVideoTrackRef.current.enabled });
        }
        originalVideoTrackRef.current = null;
      }
    } else {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = displayStream.getVideoTracks()[0];
        
        // Save original camera track
        originalVideoTrackRef.current = localStreamRef.current.getVideoTracks()[0];
        
        const senders = currentCallRef.current.peerConnection?.getSenders() || [];
        const videoSender = senders.find((s: any) => s.track?.kind === "video");
        
        if (videoSender) {
          await videoSender.replaceTrack(screenTrack);
          
          // Replace track in local stream so the user sees their screen
          if (originalVideoTrackRef.current) {
            localStreamRef.current.removeTrack(originalVideoTrackRef.current);
          }
          localStreamRef.current.addTrack(screenTrack);
          
          setIsScreenSharing(true);
          setIsCameraOn(true); // Screen share is visible
          
          if (dataConnRef.current?.open) {
            dataConnRef.current.send({ type: "CAMERA", value: true });
          }

          // Handle browser "Stop sharing" button
          screenTrack.onended = () => {
            if (originalVideoTrackRef.current && currentCallRef.current) {
              const currentSenders = currentCallRef.current.peerConnection?.getSenders() || [];
              const currentVideoSender = currentSenders.find((s: any) => s.track?.kind === "video");
              if (currentVideoSender) {
                currentVideoSender.replaceTrack(originalVideoTrackRef.current);
              }
              
              if (localStreamRef.current) {
                localStreamRef.current.removeTrack(screenTrack);
                localStreamRef.current.addTrack(originalVideoTrackRef.current);
              }
              
              const wasCameraOn = originalVideoTrackRef.current.enabled;
              setIsScreenSharing(false);
              setIsCameraOn(wasCameraOn);
              if (dataConnRef.current?.open) {
                dataConnRef.current.send({ type: "CAMERA", value: wasCameraOn });
              }
              originalVideoTrackRef.current = null;
            }
          };
        }
      } catch (err) {
        // Screen share failed
      }
    }
  }, [isScreenSharing]);

  // Fallback: if accepted but no currentCallRef, initiate call to caller
  const fallbackCall = useCallback(async (callerUserId: number) => {
    if (!peer || currentCallRef.current) return;
    const stream = await startMediaStream();
    const peerId = `mhflow-user-${callerUserId}`;
    const conn = peer.connect(peerId);
    setupDataConnection(conn);
    if (stream) {
      const call = peer.call(peerId, stream);
      currentCallRef.current = call;
      call.on("stream", (remoteStream: MediaStream) => onRemoteStream(remoteStream));
      call.on("close", () => stopMediaStream());
    }
  }, [peer, startMediaStream, stopMediaStream, onRemoteStream, setupDataConnection]);

  return {
    peer,
    localStreamRef,
    mediaError,
    isCameraOn,
    isMicOn,
    callPeer,
    answerCall,
    fallbackCall,
    stopMediaStream,
    toggleCamera,
    toggleMicrophone,
    isScreenSharing,
    toggleScreenShare,
  };
}
