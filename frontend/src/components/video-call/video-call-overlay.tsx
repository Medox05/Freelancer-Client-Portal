import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useVideoCall } from "../../context/VideoCallContext";
import {
  Phone, PhoneOff, Video, VideoOff, Mic, MicOff,
  Maximize2, Minimize2, Monitor, MonitorOff
} from "lucide-react";

export function VideoCallOverlay() {
  const location = useLocation();
  const {
    activeCall,
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

    acceptTheCall,
    rejectTheCall,
    endTheCall,
    toggleCamera,
    toggleMic,
    shareScreen,
    stopScreenShare
  } = useVideoCall();

  const localVideoRef  = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Sync local stream → video element
  useEffect(() => {
    const el = localVideoRef.current;
    if (el && localStream) {
      if (el.srcObject !== localStream) el.srcObject = localStream;
      el.play().catch(() => {});
    }
  }, [localStream, isCallActive, location.pathname]);

  // Sync remote stream → video element
  useEffect(() => {
    const el = remoteVideoRef.current;
    if (el && remoteStream) {
      if (el.srcObject !== remoteStream) el.srcObject = remoteStream;
      el.play().catch(() => {});
    }
  }, [remoteStream, isCallActive, location.pathname]);

  if (!isCallActive || !activeCall) return null;

  const isRinging      = activeCall.status === "ringing";
  const isVideoCallPage = location.pathname === "/calls";

  const getOtherUserName = () =>
    activeCall.caller_id === currentUserId
      ? activeCall.callee?.name ?? "User"
      : activeCall.caller?.name ?? "User";

  const otherInitial = getOtherUserName().charAt(0).toUpperCase();
  const selfInitial  = currentUserName.charAt(0).toUpperCase();

  // ── Layout sizing ──
  // Full-page /calls route or fullscreen → expand to fill available area
  // Mini floating widget → bottom-right corner
  const overlayClasses = `
    fixed z-[100] overflow-hidden shadow-2xl transition-all duration-500 ease-in-out
    bg-[#0d0f14] border border-white/10 text-white
    ${isFullscreen
      ? "inset-4 md:inset-6 rounded-3xl"
      : isVideoCallPage
        ? "inset-4 sm:inset-6 md:inset-8 lg:left-80 lg:top-24 lg:right-8 lg:bottom-8 rounded-3xl"
        : "bottom-6 right-6 w-[380px] h-[480px] rounded-2xl"
    }
  `;

  const isMini = !isFullscreen && !isVideoCallPage;

  return (
    <div className={overlayClasses}>
      <div className="flex flex-col h-full w-full">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-black/30 select-none shrink-0">
          <div className="flex items-center gap-2">
            {/* Live indicator dot */}
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isRinging ? "bg-amber-400" : "bg-emerald-400"}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isRinging ? "bg-amber-500" : "bg-emerald-500"}`} />
            </span>
            <span className="font-semibold text-sm text-white/90 tracking-wide">
              {isRinging
                ? activeCall.caller_id === currentUserId
                  ? `Calling ${getOtherUserName()}…`
                  : `${getOtherUserName()} is calling…`
                : getOtherUserName()}
            </span>
            {!isRinging && (
              <span className="text-[10px] text-emerald-400/80 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full">
                Live
              </span>
            )}
          </div>

          {!isMini && (
            <button
              onClick={() => setIsFullscreen(f => !f)}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition text-white/60 hover:text-white cursor-pointer"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
          )}
        </div>

        {/* ── Video Area ── */}
        <div className="relative flex-1 bg-[#0a0b10] overflow-hidden">

          {/* Remote video — center contained, preserving height and aspect ratio */}
          <video
            ref={remoteVideoRef}
            className="absolute inset-0 w-full h-full object-contain bg-slate-950/90"
            autoPlay
            playsInline
          />

          {/* Remote avatar (camera off / ringing) */}
          {(isRinging || (!isRemoteCameraOn && !isRemoteScreenSharing)) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#13151e] to-[#0d0f14]">
              <div
                className={`
                  flex items-center justify-center rounded-full font-bold tracking-widest text-white/90 shadow-2xl border border-white/10
                  ${isMini ? "w-16 h-16 text-2xl mb-2" : "w-28 h-28 sm:w-36 sm:h-36 text-5xl sm:text-6xl mb-5"}
                `}
                style={{ background: "radial-gradient(circle at 40% 40%, #2563eb44, #1e293b)" }}
              >
                {otherInitial}
              </div>
              <span className={`font-medium text-slate-400/80 ${isMini ? "text-[10px]" : "text-sm"}`}>
                {isRinging ? "Ringing…" : "Camera off"}
              </span>
            </div>
          )}

          {/* Screen sharing badge */}
          {isRemoteScreenSharing && (
            <div className="absolute top-3 left-3 bg-blue-600/90 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg backdrop-blur-sm select-none">
              <Monitor size={11} className="animate-pulse" />
              Sharing Screen
            </div>
          )}

          {/* Other user name label & Remote mic status */}
          {!isRinging && (
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium text-slate-200/90 select-none flex items-center gap-2 border border-white/5">
              <span>{getOtherUserName()}</span>
              {!isRemoteMicOn && (
                <span className="text-rose-500 flex items-center" title="Muted">
                  <MicOff size={12} />
                </span>
              )}
            </div>
          )}

          {/* ── Local PiP (Picture-in-Picture) ── */}
          <div
            className={`
              absolute right-3 bottom-3 z-10 overflow-hidden rounded-xl shadow-2xl border border-white/10 bg-[#13151e]
              ${isMini
                ? "w-16 h-20"
                : isFullscreen
                  ? "w-40 h-52 sm:w-48 sm:h-60"
                  : "w-32 h-44 sm:w-40 sm:h-52"
              }
            `}
          >
            <video
              ref={localVideoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />

            {/* Camera off avatar */}
            {!isCameraOn && !isScreenSharing && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#13151e]">
                <div
                  className={`
                    flex items-center justify-center rounded-full font-bold text-white/80 border border-white/10
                    ${isMini ? "w-8 h-8 text-xs" : "w-12 h-12 text-base"}
                  `}
                  style={{ background: "radial-gradient(circle at 40% 40%, #7c3aed44, #1e293b)" }}
                >
                  {selfInitial}
                </div>
              </div>
            )}

            {/* Local mic muted indicator badge */}
            {!isMicOn && (
              <div className="absolute top-1.5 right-1.5 bg-rose-600 text-white p-1 rounded-md shadow-md animate-pulse z-20">
                <MicOff size={9} />
              </div>
            )}

            {/* Screen sharing indicator */}
            {isScreenSharing && (
              <div className="absolute top-1.5 left-1.5 bg-blue-600/80 p-1 rounded-md z-20">
                <Monitor size={9} />
              </div>
            )}

            {/* "You" label */}
            <div className="absolute bottom-1.5 left-1.5 bg-black/50 px-1.5 py-0.5 rounded-md text-[9px] text-slate-300 select-none z-20">
              You
            </div>
          </div>
        </div>

        {/* ── Controls ── */}
        <div
          className={`
            flex justify-center items-center gap-3 border-t border-white/5 bg-black/40 backdrop-blur-sm select-none shrink-0
            ${isMini ? "py-2 px-4 gap-2" : "py-4 px-6 gap-4 sm:gap-6"}
          `}
        >
          {isRingingForCallee ? (
            /* Incoming call: Accept / Decline */
            <>
              <button
                onClick={() => acceptTheCall(activeCall.id)}
                disabled={isCallActionPending}
                className="flex flex-col items-center gap-1 group cursor-pointer disabled:opacity-50"
              >
                <span className={`
                  rounded-full bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center transition
                  shadow-lg shadow-emerald-500/25 group-hover:scale-105 duration-200
                  ${isMini ? "w-10 h-10" : "w-13 h-13 sm:w-14 sm:h-14"}
                `}>
                  <Phone size={isMini ? 18 : 22} className="text-white" />
                </span>
                {!isMini && <span className="text-[10px] text-slate-400 font-medium group-hover:text-slate-200">Accept</span>}
              </button>

              <button
                onClick={() => rejectTheCall(activeCall.id)}
                disabled={isCallActionPending}
                className="flex flex-col items-center gap-1 group cursor-pointer disabled:opacity-50"
              >
                <span className={`
                  rounded-full bg-rose-500 hover:bg-rose-400 flex items-center justify-center transition
                  shadow-lg shadow-rose-500/25 group-hover:scale-105 duration-200
                  ${isMini ? "w-10 h-10" : "w-13 h-13 sm:w-14 sm:h-14"}
                `}>
                  <PhoneOff size={isMini ? 18 : 22} className="text-white" />
                </span>
                {!isMini && <span className="text-[10px] text-slate-400 font-medium group-hover:text-slate-200">Decline</span>}
              </button>
            </>
          ) : (
            /* Active call controls */
            <>
              {/* Camera */}
              <button onClick={toggleCamera} className="flex flex-col items-center gap-1 group cursor-pointer">
                <span className={`
                  rounded-full flex items-center justify-center transition group-hover:scale-105 duration-200
                  ${isMini ? "w-9 h-9" : "w-11 h-11"}
                  ${isCameraOn
                    ? "bg-white/10 hover:bg-white/20 border border-white/10"
                    : "bg-rose-500/90 hover:bg-rose-400 shadow-md shadow-rose-500/20"}
                `}>
                  {isCameraOn ? <Video size={isMini ? 15 : 18} /> : <VideoOff size={isMini ? 15 : 18} />}
                </span>
                {!isMini && <span className="text-[10px] text-slate-400 font-medium group-hover:text-slate-200">{isCameraOn ? "Camera" : "Camera off"}</span>}
              </button>

              {/* Mic */}
              <button onClick={toggleMic} className="flex flex-col items-center gap-1 group cursor-pointer">
                <span className={`
                  rounded-full flex items-center justify-center transition group-hover:scale-105 duration-200
                  ${isMini ? "w-9 h-9" : "w-11 h-11"}
                  ${isMicOn
                    ? "bg-white/10 hover:bg-white/20 border border-white/10"
                    : "bg-rose-500/90 hover:bg-rose-400 shadow-md shadow-rose-500/20"}
                `}>
                  {isMicOn ? <Mic size={isMini ? 15 : 18} /> : <MicOff size={isMini ? 15 : 18} />}
                </span>
                {!isMini && <span className="text-[10px] text-slate-400 font-medium group-hover:text-slate-200">{isMicOn ? "Mic" : "Mic off"}</span>}
              </button>

              {/* Screen share — hide in mini mode to save space */}
              {!isMini && (
                <button
                  onClick={isScreenSharing ? stopScreenShare : shareScreen}
                  className="flex flex-col items-center gap-1 group cursor-pointer"
                >
                  <span className={`
                    w-11 h-11 rounded-full flex items-center justify-center transition group-hover:scale-105 duration-200
                    ${isScreenSharing
                      ? "bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/30 border border-blue-500/30"
                      : "bg-white/10 hover:bg-white/20 border border-white/10"}
                  `}>
                    {isScreenSharing ? <MonitorOff size={18} /> : <Monitor size={18} />}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium group-hover:text-slate-200">
                    {isScreenSharing ? "Stop share" : "Share"}
                  </span>
                </button>
              )}

              {/* End call */}
              <button
                onClick={() => endTheCall(activeCall.id)}
                disabled={isCallActionPending}
                className="flex flex-col items-center gap-1 group cursor-pointer disabled:opacity-50"
              >
                <span className={`
                  rounded-full bg-rose-600 hover:bg-rose-500 flex items-center justify-center transition
                  shadow-lg shadow-rose-600/30 group-hover:scale-105 duration-200
                  ${isMini ? "w-10 h-10" : "w-12 h-12"}
                `}>
                  <PhoneOff size={isMini ? 18 : 20} className="text-white" />
                </span>
                {!isMini && <span className="text-[10px] text-slate-400 font-medium group-hover:text-slate-200">End</span>}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
