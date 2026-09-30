"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AgentState } from "@/components/VoiceVisualizer";

interface LuxuryVoiceOrbProps {
  state: AgentState;
  isCallActive: boolean;
  amplitude: number; // 0.0 to 1.0 from real microphone or audio playback
  detectedIntent?: string | null;
}

export const LuxuryVoiceOrb: React.FC<LuxuryVoiceOrbProps> = ({
  state,
  isCallActive,
  amplitude,
  detectedIntent,
}) => {
  // Simulated organic speech modulation when Aria is speaking
  const [speechPulse, setSpeechPulse] = useState(0.2);

  useEffect(() => {
    if (state !== "speaking") return;
    const interval = setInterval(() => {
      // Create organic human-like speech cadence
      setSpeechPulse(0.3 + Math.random() * 0.7);
    }, 120);
    return () => clearInterval(interval);
  }, [state]);

  const activeLevel = state === "speaking" ? speechPulse : state === "listening" ? amplitude : 0;

  return (
    <div className="relative flex flex-col items-center justify-center my-8 select-none">
      {/* Container for the Orb & Concentric Rings */}
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
        {/* Layer 1: Ambient Outer Glow */}
        <motion.div
          animate={{
            scale: state === "listening" ? 1 + activeLevel * 0.45 : state === "speaking" ? 1 + activeLevel * 0.35 : 1,
            opacity: state === "listening" ? 0.3 + activeLevel * 0.4 : state === "speaking" ? 0.35 : 0.15,
          }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="absolute inset-0 rounded-full bg-radial from-[#EDE5F2] via-[#3B1F4A]/10 to-transparent blur-2xl pointer-events-none"
        />

        {/* Layer 2: Outer Concentric Ripple (Active during Listening / Speaking) */}
        {(state === "listening" || state === "speaking") && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              scale: [1, 1.25 + activeLevel * 0.3, 1.35],
              opacity: [0.6, 0.2, 0],
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: "easeOut",
            }}
            className="absolute w-60 h-60 rounded-full border border-[#3B1F4A]/25 pointer-events-none"
          />
        )}

        {/* Layer 3: Secondary Concentric Ring */}
        <motion.div
          animate={{
            scale: state === "listening" ? 1 + activeLevel * 0.25 : state === "speaking" ? 1 + activeLevel * 0.2 : [1, 1.04, 1],
            borderColor: state === "listening" ? "rgba(59, 31, 74, 0.4)" : "rgba(237, 229, 242, 0.9)",
          }}
          transition={
            state === "idle" || state === "ended"
              ? { duration: 3.5, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.12, ease: "easeOut" }
          }
          className="absolute w-52 h-52 rounded-full border border-[#EDE5F2] bg-white/40 backdrop-blur-xs shadow-sm flex items-center justify-center pointer-events-none"
        />

        {/* Layer 4: Third Mid Ring */}
        <motion.div
          animate={{
            scale: state === "listening" ? 1 + activeLevel * 0.18 : state === "speaking" ? 1 + activeLevel * 0.14 : [1, 1.02, 1],
          }}
          transition={
            state === "idle" || state === "ended"
              ? { duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }
              : { duration: 0.12, ease: "easeOut" }
          }
          className="absolute w-44 h-44 rounded-full border border-[#EDE5F2] bg-white/80 shadow-[0_8px_32px_-8px_rgba(36,19,41,0.08)] flex items-center justify-center"
        />

        {/* Layer 5: The Center AI Voice Core (Deep Plum #241329) */}
        <motion.div
          animate={{
            scale: state === "listening" ? 1 + activeLevel * 0.15 : state === "speaking" ? 1 + activeLevel * 0.12 : [1, 0.97, 1],
            boxShadow:
              state === "listening"
                ? "0 0 35px rgba(59, 31, 74, 0.45)"
                : state === "speaking"
                ? "0 0 40px rgba(59, 31, 74, 0.5)"
                : "0 12px 30px rgba(36, 19, 41, 0.2)",
          }}
          transition={
            state === "idle" || state === "ended"
              ? { duration: 4, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.1, ease: "easeOut" }
          }
          className="relative z-10 w-28 h-28 rounded-full bg-gradient-to-br from-[#3B1F4A] to-[#241329] flex items-center justify-center overflow-hidden cursor-default shadow-lg"
        >
          {/* Subtle inner radial highlight */}
          <div className="absolute inset-0 bg-radial from-white/20 via-transparent to-transparent pointer-events-none" />

          {/* Core Visualizer by State */}
          <AnimatePresence mode="wait">
            {state === "speaking" ? (
              /* Reactive speech waveform bars */
              <motion.div
                key="speaking"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 h-10 px-2"
              >
                {[0.4, 0.9, 0.6, 1.0, 0.7, 1.1, 0.5].map((multiplier, i) => {
                  const barHeight = Math.max(6, Math.min(32, activeLevel * 34 * multiplier + 6));
                  return (
                    <motion.div
                      key={i}
                      animate={{ height: barHeight }}
                      transition={{ duration: 0.08 }}
                      className="w-1 bg-[#EDE5F2] rounded-full"
                    />
                  );
                })}
              </motion.div>
            ) : state === "listening" ? (
              /* Live audio waveform responding to real mic amplitude */
              <motion.div
                key="listening"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 h-10 px-2"
              >
                {[0.5, 0.8, 1.2, 0.9, 1.1, 0.7, 0.4].map((mult, i) => {
                  const barHeight = Math.max(4, Math.min(34, activeLevel * 40 * mult + 4));
                  return (
                    <motion.div
                      key={i}
                      animate={{ height: barHeight }}
                      transition={{ duration: 0.06 }}
                      className="w-1 bg-white rounded-full shadow-xs"
                    />
                  );
                })}
              </motion.div>
            ) : state === "thinking" ? (
              /* Rotating radial thinking animation */
              <motion.div
                key="thinking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, rotate: 360 }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 rounded-full border-2 border-transparent border-t-[#EDE5F2] border-r-[#EDE5F2]/50"
              />
            ) : (
              /* Idle Monogram */
              <motion.span
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-serif text-3xl font-bold tracking-widest text-[#FAF8F5]/90 pl-1"
              >
                A
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* State Status Label */}
      <div className="flex items-center gap-2 mt-1">
        <motion.span
          animate={{
            scale: state === "listening" || state === "speaking" ? [1, 1.3, 1] : 1,
            backgroundColor:
              state === "listening"
                ? "#059669"
                : state === "speaking"
                ? "#3B1F4A"
                : state === "thinking"
                ? "#746C78"
                : "#746C78",
          }}
          transition={{ duration: 1, repeat: Infinity }}
          className="w-2 h-2 rounded-full bg-[#746C78]"
        />
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#241329]">
          {state === "idle" && "Ready to Talk"}
          {state === "connecting" && "Connecting..."}
          {state === "listening" && "Listening"}
          {state === "thinking" && "Thinking"}
          {state === "speaking" && "Aria is Speaking"}
          {state === "ended" && "Ready to Talk"}
        </span>
      </div>

      {/* Feature #1: Live Customer Intent Subtitle */}
      {isCallActive && detectedIntent && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2.5 px-3 py-1 rounded-full bg-[#EDE5F2] border border-[#EDE5F2] flex items-center gap-1.5"
        >
          <span className="text-[10px] font-bold tracking-widest uppercase text-[#3B1F4A]">
            Intent: {detectedIntent.replace(/_/g, " ")}
          </span>
        </motion.div>
      )}
    </div>
  );
};
