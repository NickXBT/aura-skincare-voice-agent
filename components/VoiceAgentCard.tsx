"use client";

import React from "react";
import { Mic, MicOff, PhoneCall, PhoneOff, Volume2, Sparkles, AlertCircle, Info } from "lucide-react";
import { AgentState, VoiceVisualizer } from "@/components/VoiceVisualizer";

interface VoiceAgentCardProps {
  agentState: AgentState;
  isCallActive: boolean;
  onStartCall: () => void;
  onEndCall: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  lastCustomerUtterance: string;
  errorMessage: string | null;
  onClearError: () => void;
}

export const VoiceAgentCard: React.FC<VoiceAgentCardProps> = ({
  agentState,
  isCallActive,
  onStartCall,
  onEndCall,
  isMuted,
  onToggleMute,
  lastCustomerUtterance,
  errorMessage,
  onClearError,
}) => {
  return (
    <div className="w-full bg-white rounded-3xl border border-[#E8DFED] shadow-[0_4px_24px_-4px_rgba(43,18,63,0.06)] p-6 sm:p-10 flex flex-col items-center text-center relative overflow-hidden">
      {/* Decorative subtle brand background highlight */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#F7F3FA] rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#F7F3FA] rounded-full blur-3xl pointer-events-none -z-0" />

      {/* Top status & avatar */}
      <div className="relative z-10 flex flex-col items-center mb-6">
        <div className="relative mb-4">
          {/* Avatar Ring */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-b from-[#2B123F] to-[#4A2365] p-1 shadow-md ring-4 ring-[#F7F3FA]">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden relative">
              {/* Agent initial or avatar */}
              <div className="w-full h-full bg-[#F7F3FA] flex items-center justify-center">
                <span className="font-serif text-3xl font-bold text-[#2B123F]">A</span>
              </div>
            </div>
          </div>

          {/* Connected badge */}
          <div
            className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${
              isCallActive ? "bg-emerald-500 shadow-sm" : "bg-[#6D3A91]"
            }`}
            title={isCallActive ? "Call connected" : "Agent standby"}
          >
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
        </div>

        {/* Agent Details */}
        <h2 className="text-2xl font-semibold tracking-tight text-[#2B123F] font-serif">
          Aria
        </h2>
        <p className="text-sm font-medium text-[#6F6575] mt-0.5">
          Senior Customer Support Specialist • Aura Skincare
        </p>
      </div>

      {/* Live State Visualization */}
      <div className="relative z-10 my-4 min-h-[56px] flex items-center justify-center w-full max-w-sm">
        <VoiceVisualizer state={agentState} />
      </div>

      {/* State Label Text */}
      <div className="relative z-10 text-xs font-semibold uppercase tracking-wider text-[#6D3A91] mb-6">
        {agentState === "idle" && "Ready to Connect"}
        {agentState === "connecting" && "Initializing Audio..."}
        {agentState === "listening" && (
          <span className="flex items-center justify-center gap-1.5 text-[#2B123F]">
            <span className="w-2 h-2 rounded-full bg-[#6D3A91] animate-ping" />
            Listening to you...
          </span>
        )}
        {agentState === "thinking" && "Processing & Checking Policies..."}
        {agentState === "speaking" && (
          <span className="flex items-center justify-center gap-1 text-[#4A2365]">
            <Volume2 className="w-3.5 h-3.5 animate-pulse" />
            Aria is speaking
          </span>
        )}
        {agentState === "ended" && "Call Ended • Summary Generated"}
      </div>

      {/* Live Interim Transcript Bubble */}
      {isCallActive && lastCustomerUtterance && (
        <div className="relative z-10 w-full max-w-md mb-6 px-4 py-2.5 bg-[#F7F3FA] rounded-2xl border border-[#E8DFED] text-xs text-[#1A1220] italic shadow-sm animate-fade-in">
          <span className="text-[#6D3A91] font-semibold not-italic mr-1.5">You:</span>
          "{lastCustomerUtterance}"
        </div>
      )}

      {/* Error alert if any */}
      {errorMessage && (
        <div className="relative z-10 w-full max-w-md mb-6 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-left text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Notice:</span> {errorMessage}
          </div>
          <button
            onClick={onClearError}
            className="text-rose-600 hover:text-rose-900 font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Call Action Buttons */}
      <div className="relative z-10 flex flex-wrap items-center justify-center gap-4 mt-2">
        {!isCallActive ? (
          <button
            onClick={onStartCall}
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#2B123F] hover:bg-[#4A2365] text-white font-medium rounded-full shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98] cursor-pointer"
          >
            <PhoneCall className="w-5 h-5 text-white/90 group-hover:scale-110 transition-transform" />
            <span className="tracking-wide text-base font-semibold">START CALL</span>
          </button>
        ) : (
          <div className="flex items-center gap-3">
            {/* End Call button (restrained red treatment) */}
            <button
              onClick={onEndCall}
              className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-full shadow-sm hover:shadow transition-all duration-200 active:scale-[0.98] cursor-pointer"
            >
              <PhoneOff className="w-4 h-4 text-white" />
              <span className="font-semibold text-sm">END CALL</span>
            </button>

            {/* Mute Microphone button */}
            <button
              onClick={onToggleMute}
              className={`p-3.5 rounded-full border transition-all duration-150 cursor-pointer ${
                isMuted
                  ? "bg-rose-50 border-rose-200 text-rose-700"
                  : "bg-white border-[#E8DFED] text-[#2B123F] hover:bg-[#F7F3FA]"
              }`}
              title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>

      {/* Helper caption */}
      <p className="relative z-10 text-[11px] text-[#6F6575] mt-4 max-w-xs">
        {!isCallActive
          ? "Click Start Call and allow microphone access to speak naturally to Aria."
          : "Speak naturally into your microphone. Aria will pause immediately if you interrupt."}
      </p>
    </div>
  );
};
