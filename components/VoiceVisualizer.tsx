"use client";

import React from "react";

export type AgentState = "idle" | "connecting" | "listening" | "thinking" | "speaking" | "ended";

interface VoiceVisualizerProps {
  state: AgentState;
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ state }) => {
  if (state === "speaking") {
    return (
      <div className="flex items-center justify-center gap-1.5 h-12 px-4 py-2 bg-[#F7F3FA] rounded-full border border-[#E8DFED]">
        {[0.6, 1.2, 0.4, 1.0, 1.4, 0.7, 1.3, 0.5, 1.1, 0.8].map((delay, idx) => (
          <div
            key={idx}
            className="w-1.5 bg-[#4A2365] rounded-full transition-all"
            style={{
              animation: `waveformBar 0.9s ease-in-out infinite`,
              animationDelay: `${delay * 0.3}s`,
              minHeight: "8px",
            }}
          />
        ))}
      </div>
    );
  }

  if (state === "listening") {
    return (
      <div className="relative flex items-center justify-center">
        <div className="absolute w-20 h-20 rounded-full bg-[#6D3A91]/20 animate-ping" />
        <div className="relative z-10 w-16 h-16 rounded-full bg-[#2B123F] flex items-center justify-center shadow-md animate-voice-pulse">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3z"
            />
          </svg>
        </div>
      </div>
    );
  }

  if (state === "thinking") {
    return (
      <div className="flex items-center gap-2 px-5 py-2.5 bg-[#F7F3FA] rounded-full border border-[#E8DFED]">
        <div className="w-3 h-3 rounded-full bg-[#6D3A91] animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="w-3 h-3 rounded-full bg-[#4A2365] animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="w-3 h-3 rounded-full bg-[#2B123F] animate-bounce" style={{ animationDelay: "300ms" }} />
        <span className="text-xs font-medium text-[#4A2365] ml-1 tracking-wide">Aria is thinking...</span>
      </div>
    );
  }

  if (state === "connecting") {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-[#F7F3FA] rounded-full border border-[#E8DFED] text-xs font-medium text-[#4A2365]">
        <div className="w-2.5 h-2.5 rounded-full bg-[#6D3A91] animate-ping" />
        Connecting audio stream...
      </div>
    );
  }

  // Idle state
  return (
    <div className="w-16 h-16 rounded-full bg-[#F7F3FA] border border-[#E8DFED] flex items-center justify-center text-[#4A2365]">
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.75}
          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3z"
        />
      </svg>
    </div>
  );
};
