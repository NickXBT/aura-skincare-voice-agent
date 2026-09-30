"use client";

import React from "react";
import { AgentState } from "@/components/VoiceVisualizer";

interface AuraAvatarProps {
  state: AgentState;
  isCallActive: boolean;
}

export const AuraAvatar: React.FC<AuraAvatarProps> = ({ state, isCallActive }) => {
  return (
    <div className="relative flex items-center justify-center my-6">
      {/* Outer ambient glow / breathing ring */}
      <div
        className={`absolute rounded-full transition-all duration-700 pointer-events-none ${
          state === "listening"
            ? "w-44 h-44 bg-[#3B1F4A]/10 animate-listening-pulse"
            : state === "speaking"
            ? "w-48 h-48 bg-[#3B1F4A]/8 animate-pulse"
            : isCallActive
            ? "w-40 h-40 bg-[#EEE7F2] animate-avatar-breath"
            : "w-36 h-36 bg-[#EEE7F2]/60"
        }`}
      />

      {/* Secondary soft ring */}
      <div
        className={`relative z-10 w-32 h-32 rounded-full bg-white border border-[#EEE7F2] shadow-[0_12px_32px_-8px_rgba(36,19,41,0.08)] flex items-center justify-center transition-all duration-300 ${
          state === "speaking" ? "scale-105 ring-2 ring-[#3B1F4A]/20" : ""
        }`}
      >
        {/* Deep Plum Center Core */}
        <div
          className={`w-20 h-20 rounded-full bg-[#241329] flex items-center justify-center text-white transition-all duration-500 shadow-inner ${
            state === "listening"
              ? "bg-[#3B1F4A] scale-102"
              : state === "thinking"
              ? "bg-[#241329] scale-98"
              : "bg-[#241329]"
          }`}
        >
          {state === "speaking" ? (
            /* Elegant audio waveform ripple inside core */
            <div className="flex items-center gap-1 h-8">
              {[0.4, 0.9, 0.6, 1.2, 0.7, 1.0, 0.5].map((d, i) => (
                <div
                  key={i}
                  className="w-1 bg-[#EEE7F2] rounded-full transition-all"
                  style={{
                    animation: `audioRipple 0.8s ease-in-out infinite`,
                    animationDelay: `${d * 0.25}s`,
                    minHeight: "4px",
                  }}
                />
              ))}
            </div>
          ) : state === "thinking" ? (
            /* Subtle three-dot rhythm */
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EEE7F2] animate-pulse" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#EEE7F2] animate-pulse" style={{ animationDelay: "180ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#EEE7F2] animate-pulse" style={{ animationDelay: "360ms" }} />
            </div>
          ) : state === "listening" ? (
            /* Gentle mic wave indicator */
            <div className="w-2.5 h-2.5 rounded-full bg-[#EEE7F2] animate-ping" />
          ) : (
            /* Idle Monogram */
            <span className="font-serif text-2xl font-semibold tracking-wider text-[#FAF9F7]">
              A
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
