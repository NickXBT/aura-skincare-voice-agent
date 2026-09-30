"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  FileText,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ArrowLeft,
  MessageSquare,
  AlertCircle,
  Truck,
  Package,
} from "lucide-react";
import { AgentState } from "@/components/VoiceVisualizer";
import { Message } from "@/lib/agent/chat-engine";
import { CallIntelligenceReport } from "@/lib/agent/call-summary";
import { ToolCallResult } from "@/lib/tools/order-tool";
import { Order } from "@/lib/orders/database";

interface VoiceCallScreenProps {
  agentState: AgentState;
  isCallActive: boolean;
  isConnecting: boolean;
  permissionError: string | null;
  onStartCall: () => Promise<void>;
  onEndCall: () => void;
  onBackToChat: () => void;
  onBackToHome: () => void;
  messages: Message[];
  micAmplitude: number; // 0.0 - 1.0 real microphone volume
  postCallReport: CallIntelligenceReport | null;
  onStartNewCall: () => void;
}

export const VoiceCallScreen: React.FC<VoiceCallScreenProps> = ({
  agentState,
  isCallActive,
  isConnecting,
  permissionError,
  onStartCall,
  onEndCall,
  onBackToChat,
  onBackToHome,
  messages,
  micAmplitude,
  postCallReport,
  onStartNewCall,
}) => {
  // Call controls
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [showJsonDetails, setShowJsonDetails] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  // Active call timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCallActive) {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [isCallActive]);

  // Format MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Filter messages to user & assistant
  const displayMessages = messages.filter((m) => m.role === "user" || m.role === "assistant");
  const latestMessage = displayMessages[displayMessages.length - 1];

  // Copy JSON handler
  const handleCopyJson = () => {
    if (!postCallReport) return;
    navigator.clipboard.writeText(JSON.stringify(postCallReport, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FAF9FB] text-[#17131A] flex flex-col justify-between selection:bg-[#F0EAF4] selection:text-[#4B2859]">
      {/* 1. Call Screen Top Bar */}
      <header className="w-full px-6 sm:px-12 py-4 bg-white/80 backdrop-blur-md border-b border-[#E9E5EB] flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={isCallActive ? onEndCall : onBackToHome}
            className="p-2 rounded-xl text-[#716A77] hover:text-[#17131A] hover:bg-[#F0EAF4] transition-colors cursor-pointer"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-base text-[#17131A] tracking-wider">
                ARIA
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#716A77] border-l border-[#E9E5EB] pl-2">
                Aura Support
              </span>
            </div>
          </div>
        </div>

        {/* Live Call Duration / Status Pill */}
        <div className="flex items-center gap-2">
          {isCallActive ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-medium shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>{formatTime(callDuration)}</span>
            </div>
          ) : isConnecting ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-700" />
              <span>Connecting…</span>
            </div>
          ) : (
            <button
              onClick={onBackToChat}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium text-[#4B2859] hover:bg-[#F0EAF4] transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Switch to Chat</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. Main Viewport */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-6 sm:py-10 flex flex-col items-center justify-center text-center">
        {postCallReport && !isCallActive ? (
          /* ================= POST-CALL SUMMARY SCREEN ================= */
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-xl mx-auto text-left space-y-6"
          >
            <div className="text-center space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[#716A77]">
                Call Completed
              </span>
              <h2 className="text-3xl font-serif font-bold text-[#17131A]">
                Call Summary
              </h2>
            </div>

            {/* Human-Friendly Summary Card */}
            <div className="bg-white rounded-3xl border border-[#E9E5EB] p-6 shadow-[0_8px_30px_-6px_rgba(75,40,89,0.06)] space-y-4">
              <div className="flex items-center justify-between border-b border-[#E9E5EB] pb-3">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#716A77] block">
                    Customer Intent
                  </span>
                  <span className="text-base font-bold text-[#17131A] tracking-tight">
                    {postCallReport.outcome.customer_intent.replace(/_/g, " ")}
                  </span>
                </div>
                <div>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      postCallReport.outcome.resolution_status === "RESOLVED"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : postCallReport.outcome.resolution_status === "OUT_OF_SCOPE"
                        ? "bg-[#F0EAF4] text-[#4B2859] border border-[#4B2859]/20"
                        : "bg-amber-50 text-amber-800 border border-amber-200"
                    }`}
                  >
                    {postCallReport.outcome.resolution_status.replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              {postCallReport.outcome.order_id && (
                <div className="flex justify-between text-xs py-1 border-b border-[#E9E5EB]">
                  <span className="text-[#716A77]">Order Discussed:</span>
                  <span className="font-mono font-bold text-[#4B2859]">
                    {postCallReport.outcome.order_id}
                  </span>
                </div>
              )}

              <div className="pt-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#716A77] block mb-1">
                  Call Summary
                </span>
                <p className="text-sm text-[#17131A] leading-relaxed">
                  {postCallReport.outcome.call_summary}
                </p>
              </div>
            </div>

            {/* Accordion 1: Full Transcript */}
            <div className="bg-white rounded-2xl border border-[#E9E5EB] overflow-hidden">
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-[#FAF9FB] transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#17131A]">
                  <FileText className="w-3.5 h-3.5 text-[#4B2859]" />
                  Full Transcript ({displayMessages.length} turns)
                </span>
                {showTranscript ? <ChevronUp className="w-4 h-4 text-[#716A77]" /> : <ChevronDown className="w-4 h-4 text-[#716A77]" />}
              </button>

              {showTranscript && (
                <div className="px-5 pb-5 pt-1 border-t border-[#E9E5EB] bg-[#FAF9FB]/50 space-y-3 max-h-60 overflow-y-auto">
                  {displayMessages.map((m, i) => (
                    <div key={i} className="text-xs space-y-0.5">
                      <span className="font-semibold text-[11px] uppercase tracking-wider text-[#716A77]">
                        {m.role === "user" ? "You: " : "ARIA: "}
                      </span>
                      <p className="text-[#17131A] leading-relaxed">{m.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Accordion 2: Structured JSON Data */}
            <div className="bg-white rounded-2xl border border-[#E9E5EB] overflow-hidden">
              <button
                onClick={() => setShowJsonDetails(!showJsonDetails)}
                className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-[#FAF9FB] transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#17131A]">
                  <Sparkles className="w-3.5 h-3.5 text-[#4B2859]" />
                  Structured Evaluation JSON
                </span>
                {showJsonDetails ? <ChevronUp className="w-4 h-4 text-[#716A77]" /> : <ChevronDown className="w-4 h-4 text-[#716A77]" />}
              </button>

              {showJsonDetails && (
                <div className="p-4 border-t border-[#E9E5EB] bg-[#FAF9FB] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#716A77]">Schema Output:</span>
                    <button
                      onClick={handleCopyJson}
                      className="flex items-center gap-1 text-[11px] text-[#4B2859] hover:underline"
                    >
                      {copiedJson ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedJson ? "Copied" : "Copy JSON"}</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-white rounded-xl border border-[#E9E5EB] font-mono text-[10px] text-[#17131A] overflow-x-auto leading-relaxed">
                    {JSON.stringify(
                      {
                        customer_intent: postCallReport.outcome.customer_intent,
                        order_id: postCallReport.outcome.order_id || "None",
                        resolution_status: postCallReport.outcome.resolution_status,
                        call_summary: postCallReport.outcome.call_summary,
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                onClick={onStartNewCall}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#4B2859] hover:bg-[#381E43] text-white text-xs font-semibold tracking-wide shadow-md transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Start New Call</span>
              </button>
              <button
                onClick={onBackToChat}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white hover:bg-[#F0EAF4] border border-[#E9E5EB] text-[#17131A] text-xs font-semibold tracking-wide transition-all cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#4B2859]" />
                <span>Continue in Chat</span>
              </button>
            </div>
          </motion.div>
        ) : !isCallActive && !isConnecting ? (
          /* ================= BEFORE CALL SCREEN ================= */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center max-w-md w-full space-y-6"
          >
            {/* Visual Icon */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#32183F] via-[#4B2859] to-[#714187] flex items-center justify-center shadow-[0_12px_35px_-8px_rgba(75,40,89,0.35)]">
              <Phone className="w-10 h-10 text-white fill-current" />
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#17131A]">
                Talk with ARIA
              </h2>
              <p className="text-sm text-[#716A77] leading-relaxed max-w-sm">
                Get help with your Aura Skincare order, delivery, returns, cancellations, and products through a natural spoken conversation.
              </p>
            </div>

            {/* Microphone permission alert if denied */}
            {permissionError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 text-left flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">{permissionError}</p>
                  <p className="text-[11px] text-rose-700">
                    Microphone access is needed to talk with ARIA. Please check browser permissions and click Start Call again.
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="w-full space-y-3 pt-2">
              <button
                onClick={onStartCall}
                className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-[#4B2859] hover:bg-[#381E43] active:scale-[0.98] text-white text-sm font-semibold tracking-wide shadow-[0_8px_25px_-6px_rgba(75,40,89,0.35)] transition-all cursor-pointer"
              >
                <Phone className="w-4 h-4 fill-current" />
                <span>Start Call</span>
              </button>

              <button
                onClick={onBackToChat}
                className="w-full text-xs font-semibold text-[#716A77] hover:text-[#17131A] py-2 transition-colors cursor-pointer"
              >
                Back to Chat
              </button>
            </div>
          </motion.div>
        ) : isConnecting ? (
          /* ================= CONNECTING SCREEN ================= */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center space-y-6"
          >
            <div className="relative w-28 h-28 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-[#4B2859]/20 animate-ping" />
              <div className="w-20 h-20 rounded-full bg-[#4B2859] flex items-center justify-center shadow-lg">
                <Sparkles className="w-8 h-8 text-white animate-spin" />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-serif font-bold text-[#17131A]">
                Connecting to ARIA…
              </h3>
              <p className="text-xs text-[#716A77]">
                Initializing browser microphone and speech recognition
              </p>
            </div>
          </motion.div>
        ) : (
          /* ================= CONNECTED LIVE CALL ================= */
          <div className="w-full flex flex-col items-center justify-center space-y-6">
            {/* Living Voice Visual Indicator (Centerpiece driven by real amplitude) */}
            <div className="relative w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center select-none">
              {/* Layer 1: Ambient Reactive Glow */}
              <motion.div
                animate={{
                  scale: agentState === "listening" ? 1 + micAmplitude * 0.45 : agentState === "speaking" ? 1.15 : [1, 1.05, 1],
                  opacity: agentState === "listening" ? 0.35 + micAmplitude * 0.35 : 0.25,
                }}
                transition={
                  agentState === "idle"
                    ? { duration: 4, repeat: Infinity, ease: "easeInOut" }
                    : { duration: 0.1 }
                }
                className="absolute inset-0 rounded-full bg-radial from-[#F0EAF4] via-[#4B2859]/15 to-transparent blur-2xl pointer-events-none"
              />

              {/* Layer 2: Ethereal Concentric Ripple on Acoustic Input */}
              {agentState === "listening" && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{
                    scale: [0.95, 1.25 + micAmplitude * 0.3, 1.35],
                    opacity: [0.5, 0.15, 0],
                  }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
                  className="absolute w-44 h-44 rounded-full border border-[#4B2859]/25 pointer-events-none"
                />
              )}

              {/* Layer 3: Central Orb Sphere */}
              <motion.div
                animate={{
                  scale: agentState === "listening" ? 1 + micAmplitude * 0.15 : agentState === "speaking" ? 1.06 : 1,
                  boxShadow:
                    agentState === "listening"
                      ? "0 0 35px rgba(75, 40, 89, 0.3)"
                      : agentState === "speaking"
                      ? "0 0 40px rgba(75, 40, 89, 0.4)"
                      : "0 10px 30px rgba(23, 19, 26, 0.12)",
                }}
                transition={{ duration: 0.1 }}
                className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-[#4B2859] via-[#32183F] to-[#1E0D27] flex items-center justify-center shadow-lg"
              >
                {/* Visualizer Inside Sphere */}
                <AnimatePresence mode="wait">
                  {agentState === "speaking" ? (
                    <motion.div
                      key="speaking"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-1 h-8"
                    >
                      {[0.5, 1.2, 0.7, 1.4, 0.8, 0.4].map((mult, i) => (
                        <span
                          key={i}
                          className="w-1 bg-[#F0EAF4] rounded-full animate-[pulse_0.8s_infinite_ease-in-out]"
                          style={{ height: `${12 * mult + 6}px` }}
                        />
                      ))}
                    </motion.div>
                  ) : agentState === "listening" ? (
                    <motion.div
                      key="listening"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-1 h-8"
                    >
                      {[0.4, 0.9, 1.3, 0.8, 1.1, 0.5].map((mult, i) => {
                        const barHeight = Math.max(5, Math.min(26, micAmplitude * 32 * mult + 5));
                        return (
                          <div
                            key={i}
                            style={{ height: `${barHeight}px` }}
                            className="w-1 bg-white rounded-full transition-all duration-75"
                          />
                        );
                      })}
                    </motion.div>
                  ) : agentState === "thinking" ? (
                    <motion.div
                      key="thinking"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                      className="w-8 h-8 rounded-full border-2 border-transparent border-t-white border-r-white/40"
                    />
                  ) : (
                    <span className="font-serif text-2xl font-bold text-white/90">A</span>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Real State Text */}
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2 text-sm font-semibold tracking-wide text-[#17131A]">
                {agentState === "listening" ? (
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    Listening…
                  </span>
                ) : agentState === "thinking" ? (
                  <span className="flex items-center gap-1.5 text-[#716A77]">
                    <Sparkles className="w-4 h-4 text-[#4B2859] animate-spin" />
                    Thinking…
                  </span>
                ) : agentState === "speaking" ? (
                  <span className="flex items-center gap-1.5 text-[#4B2859]">
                    <Volume2 className="w-4 h-4 text-[#4B2859] animate-pulse" />
                    ARIA is speaking…
                  </span>
                ) : (
                  <span>ARIA is ready</span>
                )}
              </div>
              <p className="text-xs text-[#716A77]">
                {agentState === "speaking"
                  ? "Speak anytime to interrupt"
                  : "Speak naturally into your microphone"}
              </p>
            </div>

            {/* Current Conversational Turn Snippet */}
            {latestMessage && (
              <motion.div
                key={latestMessage.content}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-lg px-4 py-2.5 rounded-2xl bg-white border border-[#E9E5EB] shadow-2xs text-xs sm:text-sm text-[#17131A] leading-relaxed"
              >
                <span className="font-semibold text-[11px] text-[#4B2859] uppercase tracking-wider block mb-0.5">
                  {latestMessage.role === "user" ? "You asked:" : "ARIA:"}
                </span>
                &ldquo;{latestMessage.content}&rdquo;
              </motion.div>
            )}
          </div>
        )}
      </main>

      {/* 3. Call Controls Footer (Only when connected) */}
      {isCallActive && (
        <footer className="w-full py-6 px-6 bg-white/90 backdrop-blur-md border-t border-[#E9E5EB] flex items-center justify-center gap-6 sticky bottom-0 z-20">
          {/* Mute Mic */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isMuted
                ? "bg-rose-50 border border-rose-200 text-rose-700"
                : "bg-[#FAF9FB] hover:bg-[#F0EAF4] border border-[#E9E5EB] text-[#17131A]"
            }`}
            title={isMuted ? "Unmute mic" : "Mute mic"}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-[#4B2859]" />}
          </button>

          {/* End Call Button (Prominent Red) */}
          <button
            onClick={onEndCall}
            className="group flex items-center justify-center gap-2 px-8 h-12 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-rose-600/25 transition-all cursor-pointer"
            title="End call"
          >
            <PhoneOff className="w-4 h-4" />
            <span>End Call</span>
          </button>

          {/* Speaker Mute */}
          <button
            onClick={() => setIsSpeakerMuted(!isSpeakerMuted)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isSpeakerMuted
                ? "bg-amber-50 border border-amber-200 text-amber-700"
                : "bg-[#FAF9FB] hover:bg-[#F0EAF4] border border-[#E9E5EB] text-[#17131A]"
            }`}
            title={isSpeakerMuted ? "Unmute speaker" : "Mute speaker"}
          >
            {isSpeakerMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-[#4B2859]" />}
          </button>
        </footer>
      )}
    </div>
  );
};
