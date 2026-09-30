"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Package, RotateCcw, ShieldCheck } from "lucide-react";
import { AgentState } from "@/components/VoiceVisualizer";

interface AssistantEmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
  agentState: AgentState;
  amplitude?: number;
}

export const AssistantEmptyState: React.FC<AssistantEmptyStateProps> = ({
  onSelectPrompt,
  agentState,
  amplitude = 0,
}) => {
  const suggestions = [
    { label: "Where is my order ORD-101?", icon: Package },
    { label: "Can I return my sunscreen?", icon: RotateCcw },
    { label: "Can I cancel my order?", icon: ShieldCheck },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center text-center px-4 my-auto py-12 select-none">
      {/* Small Living AI Visual (approx 52px) */}
      <div className="relative w-14 h-14 mb-6 flex items-center justify-center">
        {/* Soft background halo */}
        <motion.div
          animate={{
            scale: agentState === "listening" ? 1 + amplitude * 0.5 : [1, 1.15, 1],
            opacity: agentState === "listening" ? 0.6 : [0.35, 0.55, 0.35],
          }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full bg-radial from-[#F0EAF4] via-[#4B2859]/15 to-transparent blur-md pointer-events-none"
        />

        {/* Core sphere with fluid gradient */}
        <motion.div
          animate={{
            scale: agentState === "listening" ? 1 + amplitude * 0.2 : [1, 1.04, 1],
            rotate: [0, 90, 180, 270, 360],
          }}
          transition={{
            scale: { duration: 0.1 },
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
          }}
          className="relative z-10 w-11 h-11 rounded-full bg-gradient-to-tr from-[#32183F] via-[#4B2859] to-[#714187] shadow-[0_6px_20px_-4px_rgba(75,40,89,0.35)] flex items-center justify-center"
        >
          <Sparkles className="w-5 h-5 text-white/90" />
        </motion.div>
      </div>

      {/* Main Headline */}
      <h1 className="text-3xl sm:text-5xl font-bold font-sans tracking-tight text-[#17131A] leading-tight">
        How can I help you today?
      </h1>

      {/* Subtitle */}
      <p className="mt-3 text-sm sm:text-base text-[#716A77] max-w-md font-normal leading-relaxed">
        Ask about your Aura Skincare order, delivery tracking, return policy, or product recommendations.
      </p>

      {/* Suggestion Chips */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-2 max-w-xl">
        {suggestions.map((s, idx) => {
          const Icon = s.icon;
          return (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectPrompt(s.label)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#FAF9FB] hover:bg-[#F0EAF4] border border-[#E9E5EB] text-xs font-medium text-[#17131A] transition-all duration-150 cursor-pointer shadow-2xs"
            >
              <Icon className="w-3.5 h-3.5 text-[#4B2859]" />
              <span>{s.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
