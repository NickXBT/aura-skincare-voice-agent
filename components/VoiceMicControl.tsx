"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Square, PhoneOff, Sparkles, Volume2 } from "lucide-react";
import { AgentState } from "@/components/VoiceVisualizer";

interface VoiceMicControlProps {
  state: AgentState;
  isCallActive: boolean;
  onToggleCall: () => void;
  onInterrupt?: () => void;
}

export const VoiceMicControl: React.FC<VoiceMicControlProps> = ({
  state,
  isCallActive,
  onToggleCall,
  onInterrupt,
}) => {
  return (
    <div className="flex items-center justify-center gap-3 mt-4">
      {/* Primary Pill Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => {
          if (!isCallActive) {
            onToggleCall();
          } else if (state === "speaking" && onInterrupt) {
            onInterrupt();
          }
        }}
        className={`group relative flex items-center gap-3 px-7 py-3.5 rounded-full font-medium text-sm transition-all duration-300 shadow-sm ${
          !isCallActive
            ? "bg-[#32183F] text-white hover:bg-[#25122F] shadow-[0_4px_20px_rgba(50,24,63,0.18)]"
            : state === "listening"
            ? "bg-[#FAF9FB] text-[#17131A] border border-[#32183F]/30 shadow-[0_2px_12px_rgba(50,24,63,0.08)]"
            : state === "speaking"
            ? "bg-[#EDE5F2] text-[#32183F] border border-[#32183F]/20 hover:border-[#32183F]/40 cursor-pointer"
            : "bg-white text-[#706A74] border border-[#EEEAF0]"
        }`}
        aria-label={!isCallActive ? "Start conversation" : `ARIA is ${state}`}
      >
        <AnimatePresence mode="wait">
          {!isCallActive ? (
            <motion.div
              key="start"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-2.5"
            >
              <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center">
                <Mic className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="tracking-tight font-medium">Start conversation</span>
            </motion.div>
          ) : state === "listening" ? (
            <motion.div
              key="listening"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-2.5"
            >
              <div className="flex items-center gap-1 h-4">
                <span className="w-1 h-3.5 bg-emerald-600 rounded-full animate-[pulse_1s_infinite_ease-in-out]" />
                <span className="w-1 h-5 bg-emerald-600 rounded-full animate-[pulse_1.2s_infinite_ease-in-out_delay-100]" />
                <span className="w-1 h-2.5 bg-emerald-600 rounded-full animate-[pulse_0.9s_infinite_ease-in-out_delay-200]" />
              </div>
              <span className="tracking-tight text-[#17131A] font-medium">Listening…</span>
            </motion.div>
          ) : state === "thinking" ? (
            <motion.div
              key="thinking"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-2.5 text-[#706A74]"
            >
              <Sparkles className="w-4 h-4 animate-spin text-[#32183F]" />
              <span className="tracking-tight font-medium">Thinking…</span>
            </motion.div>
          ) : state === "speaking" ? (
            <motion.div
              key="speaking"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-2.5"
            >
              <Volume2 className="w-4 h-4 text-[#32183F] animate-pulse" />
              <span className="tracking-tight font-medium">Speaking…</span>
              <span className="text-xs text-[#706A74] border-l border-[#32183F]/20 pl-2">tap to interrupt</span>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-2"
            >
              <Mic className="w-4 h-4 text-[#706A74]" />
              <span className="tracking-tight">Ready</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* End Session Pill Button when call is active */}
      {isCallActive && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleCall}
          className="flex items-center justify-center w-11 h-11 rounded-full bg-white border border-[#EEEAF0] text-[#706A74] hover:text-[#9E2A2B] hover:border-[#F2D7D7] hover:bg-[#FFF8F8] transition-all shadow-xs"
          title="End conversation"
          aria-label="End conversation"
        >
          <PhoneOff className="w-4 h-4" />
        </motion.button>
      )}
    </div>
  );
};
