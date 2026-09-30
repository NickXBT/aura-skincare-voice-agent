"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AgentState } from "@/components/VoiceVisualizer";

interface AriaOrbProps {
  state: AgentState;
  isCallActive: boolean;
  amplitude: number; // 0.0 to 1.0 from real microphone
}

export const AriaOrb: React.FC<AriaOrbProps> = ({ state, isCallActive, amplitude }) => {
  // Speech modulation simulation for organic voice cadence
  const [speechVolume, setSpeechVolume] = useState(0.2);

  useEffect(() => {
    if (state !== "speaking") return;
    const interval = setInterval(() => {
      setSpeechVolume(0.25 + Math.random() * 0.7);
    }, 110);
    return () => clearInterval(interval);
  }, [state]);

  const activeLevel = state === "speaking" ? speechVolume : state === "listening" ? amplitude : 0;

  return (
    <div className="relative flex flex-col items-center justify-center my-6 sm:my-10 select-none">
      {/* Orb Canvas Frame */}
      <div className="relative w-64 h-64 sm:w-76 sm:h-76 flex items-center justify-center">
        {/* Layer 1: Atmospheric Ambient Radial Diffusion */}
        <motion.div
          animate={{
            scale: state === "listening" ? 1 + activeLevel * 0.45 : state === "speaking" ? 1 + activeLevel * 0.35 : [1, 1.06, 1],
            opacity: state === "listening" ? 0.35 + activeLevel * 0.35 : state === "speaking" ? 0.38 : 0.16,
          }}
          transition={
            state === "idle" || state === "ended"
              ? { duration: 5.5, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.12, ease: "easeOut" }
          }
          className="absolute inset-0 rounded-full bg-radial from-[#EDE5F2] via-[#32183F]/12 to-transparent blur-3xl pointer-events-none"
        />

        {/* Layer 2: Ethereal Concentric Ripple on Acoustic Input */}
        {(state === "listening" || state === "speaking") && (
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{
              scale: [0.95, 1.25 + activeLevel * 0.3, 1.4],
              opacity: [0.55, 0.2, 0],
            }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: "easeOut",
            }}
            className="absolute w-56 h-56 sm:w-64 sm:h-64 rounded-full border border-[#32183F]/20 pointer-events-none"
          />
        )}

        {/* Layer 3: Translucent Outer Ring (Calm breathing) */}
        <motion.div
          animate={{
            scale: state === "listening" ? 1 + activeLevel * 0.24 : state === "speaking" ? 1 + activeLevel * 0.18 : [1, 1.03, 1],
            borderColor: state === "listening" ? "rgba(50, 24, 63, 0.35)" : "rgba(237, 229, 242, 0.85)",
          }}
          transition={
            state === "idle" || state === "ended"
              ? { duration: 4.5, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.1, ease: "easeOut" }
          }
          className="absolute w-48 h-48 sm:w-56 sm:h-56 rounded-full border border-[#EDE5F2] bg-white/40 backdrop-blur-xs shadow-sm flex items-center justify-center pointer-events-none"
        />

        {/* Layer 4: Middle Soft Depth Ring */}
        <motion.div
          animate={{
            scale: state === "listening" ? 1 + activeLevel * 0.16 : state === "speaking" ? 1 + activeLevel * 0.12 : [1, 1.015, 1],
          }}
          transition={
            state === "idle" || state === "ended"
              ? { duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.15 }
              : { duration: 0.1, ease: "easeOut" }
          }
          className="absolute w-40 h-40 sm:w-48 sm:h-48 rounded-full border border-[#EDE5F2] bg-white/70 shadow-[0_8px_30px_-6px_rgba(50,24,63,0.06)] flex items-center justify-center"
        />

        {/* Layer 5: Thinking Orbit (Flowing light orbiting the perimeter) */}
        {state === "thinking" && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
            className="absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full pointer-events-none"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[#32183F] blur-[1px] shadow-[0_0_8px_#32183F]" />
          </motion.div>
        )}

        {/* Layer 6: Deep Plum Core Sphere (#32183F) */}
        <motion.div
          animate={{
            scale: state === "listening" ? 1 + activeLevel * 0.12 : state === "speaking" ? 1 + activeLevel * 0.1 : [1, 0.98, 1],
            boxShadow:
              state === "listening"
                ? "0 0 35px rgba(50, 24, 63, 0.35)"
                : state === "speaking"
                ? "0 0 40px rgba(50, 24, 63, 0.45)"
                : "0 14px 34px rgba(23, 19, 26, 0.16)",
          }}
          transition={
            state === "idle" || state === "ended"
              ? { duration: 4.5, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.08, ease: "easeOut" }
          }
          className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-[#4A2365] via-[#32183F] to-[#1E0D27] flex items-center justify-center overflow-hidden cursor-default"
        >
          {/* Subtle inner radial highlight */}
          <div className="absolute inset-0 bg-radial from-white/18 via-transparent to-transparent pointer-events-none" />

          {/* Dynamic Core Visualizer */}
          <AnimatePresence mode="wait">
            {state === "speaking" ? (
              /* Reactive speech waveform bars */
              <motion.div
                key="speaking"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                className="flex items-center gap-1.5 h-10 px-2"
              >
                {[0.4, 0.8, 1.1, 0.7, 1.2, 0.85, 0.45].map((multiplier, i) => {
                  const barHeight = Math.max(5, Math.min(30, activeLevel * 32 * multiplier + 5));
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
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                className="flex items-center gap-1.5 h-10 px-2"
              >
                {[0.5, 0.8, 1.2, 0.9, 1.15, 0.75, 0.45].map((mult, i) => {
                  const barHeight = Math.max(4, Math.min(32, activeLevel * 38 * mult + 4));
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
              /* Flowing light ring */
              <motion.div
                key="thinking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, rotate: 360 }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 rounded-full border-2 border-transparent border-t-[#EDE5F2] border-r-[#EDE5F2]/40"
              />
            ) : (
              /* Idle Monogram */
              <motion.span
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-serif text-2xl sm:text-3xl font-bold tracking-widest text-[#FAF9FB]/90 pl-0.5"
              >
                A
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* State Text Indicator */}
      <div className="h-6 flex items-center justify-center mt-2">
        <AnimatePresence mode="wait">
          {state === "listening" ? (
            <motion.div
              key="listening"
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#32183F]"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>Listening…</span>
            </motion.div>
          ) : state === "thinking" ? (
            <motion.div
              key="thinking"
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#706A74]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#32183F] animate-ping" />
              <span>Thinking…</span>
            </motion.div>
          ) : state === "speaking" ? (
            <motion.div
              key="speaking"
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#32183F]"
            >
              <span className="w-2 h-2 rounded-full bg-[#32183F] animate-pulse" />
              <span>Speaking…</span>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
};
