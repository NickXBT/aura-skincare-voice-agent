"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  ArrowUp,
  Plus,
  Square,
  Sparkles,
  Volume2,
  X,
  Package,
  RotateCcw,
} from "lucide-react";
import { AgentState } from "@/components/VoiceVisualizer";

interface AssistantComposerProps {
  onSendMessage: (text: string) => void;
  agentState: AgentState;
  isCallActive: boolean;
  onToggleVoice: () => void;
  onStopSpeaking: () => void;
  amplitude: number; // 0.0 to 1.0 real microphone level
}

export const AssistantComposer: React.FC<AssistantComposerProps> = ({
  onSendMessage,
  agentState,
  isCallActive,
  onToggleVoice,
  onStopSpeaking,
  amplitude,
}) => {
  const [text, setText] = useState("");
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [speechSimLevel, setSpeechSimLevel] = useState(0.25);

  // Modulation for speaking state
  useEffect(() => {
    if (agentState !== "speaking") return;
    const interval = setInterval(() => {
      setSpeechSimLevel(0.2 + Math.random() * 0.7);
    }, 120);
    return () => clearInterval(interval);
  }, [agentState]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text.trim());
    setText("");
    setShowQuickMenu(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isVoiceMode = isCallActive || agentState === "listening" || agentState === "thinking" || agentState === "speaking";

  return (
    <div className="w-full max-w-[800px] mx-auto px-4 pb-4 select-none">
      {/* Quick Menu Popover */}
      <AnimatePresence>
        {showQuickMenu && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="mb-2 p-2 bg-white rounded-2xl border border-[#E9E5EB] shadow-lg flex flex-col gap-1 text-xs text-[#17131A] max-w-xs"
          >
            <button
              onClick={() => {
                setText("Where is my order ORD-101?");
                setShowQuickMenu(false);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#F0EAF4] transition-colors text-left"
            >
              <Package className="w-3.5 h-3.5 text-[#4B2859]" />
              <span>Track order ORD-101</span>
            </button>
            <button
              onClick={() => {
                setText("Can I return my sunscreen?");
                setShowQuickMenu(false);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#F0EAF4] transition-colors text-left"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#4B2859]" />
              <span>Ask about return policy</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Composer Container */}
      <div className="relative rounded-[26px] bg-white border border-[#E9E5EB] shadow-[0_8px_30px_-6px_rgba(75,40,89,0.08)] transition-all duration-300">
        <AnimatePresence mode="wait">
          {/* VOICE MODE: Listening, Thinking, or Speaking */}
          {isVoiceMode ? (
            <motion.div
              key="voice-mode"
              initial={{ opacity: 0, height: 58 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 58 }}
              transition={{ duration: 0.2 }}
              className="p-4 sm:p-5 flex flex-col items-center justify-center gap-3 text-center min-h-[110px]"
            >
              {/* Header Status */}
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wide">
                {agentState === "listening" ? (
                  <span className="text-[#17131A] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    Listening…
                  </span>
                ) : agentState === "thinking" ? (
                  <span className="text-[#716A77] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#4B2859] animate-spin" />
                    Thinking…
                  </span>
                ) : (
                  <span className="text-[#4B2859] flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-[#4B2859] animate-pulse" />
                    ARIA is speaking…
                  </span>
                )}
              </div>

              {/* Acoustic Waveform responding to real microphone amplitude */}
              <div className="flex items-center justify-center gap-1 h-8 px-4">
                {agentState === "listening" ? (
                  /* Live Waveform from Physical Microphone */
                  [0.3, 0.6, 1.2, 0.8, 1.4, 0.9, 0.5].map((multiplier, i) => {
                    const barHeight = Math.max(4, Math.min(30, amplitude * 36 * multiplier + 4));
                    return (
                      <motion.div
                        key={i}
                        animate={{ height: barHeight }}
                        transition={{ duration: 0.06 }}
                        className="w-1 bg-[#4B2859] rounded-full"
                      />
                    );
                  })
                ) : agentState === "speaking" ? (
                  /* Organic Speech Playback Waveform */
                  [0.4, 0.8, 1.3, 0.9, 1.2, 0.7, 0.4].map((mult, i) => {
                    const barHeight = Math.max(5, Math.min(28, speechSimLevel * 32 * mult + 4));
                    return (
                      <motion.div
                        key={i}
                        animate={{ height: barHeight }}
                        transition={{ duration: 0.1 }}
                        className="w-1 bg-[#4B2859] rounded-full"
                      />
                    );
                  })
                ) : (
                  /* Thinking Flow Dots */
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#4B2859] animate-[bounce_1s_infinite_100ms]" />
                    <span className="w-2 h-2 rounded-full bg-[#4B2859] animate-[bounce_1s_infinite_200ms]" />
                    <span className="w-2 h-2 rounded-full bg-[#4B2859] animate-[bounce_1s_infinite_300ms]" />
                  </div>
                )}
              </div>

              {/* Action Controls in Voice Mode */}
              <div className="flex items-center gap-2 mt-1">
                {agentState === "speaking" ? (
                  <button
                    onClick={onStopSpeaking}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#F0EAF4] hover:bg-[#E2D5E8] text-[#4B2859] text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    <span>Stop speaking</span>
                  </button>
                ) : (
                  <button
                    onClick={onToggleVoice}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#FAF9FB] hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-[#E9E5EB] text-[#716A77] text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Square className="w-3 h-3" />
                    <span>Tap to stop</span>
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            /* TEXT COMPOSER MODE */
            <motion.form
              key="text-mode"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5"
            >
              {/* Left Action: Quick Menu Icon */}
              <button
                type="button"
                onClick={() => setShowQuickMenu(!showQuickMenu)}
                className="w-9 h-9 rounded-full text-[#716A77] hover:text-[#17131A] hover:bg-[#F0EAF4]/60 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="Quick prompts"
                aria-label="Quick prompts"
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* Center: Main Input */}
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask ARIA anything..."
                className="flex-1 bg-transparent text-[16px] text-[#17131A] placeholder:text-[#716A77]/70 outline-none px-2"
              />

              {/* Right: Microphone Button */}
              <button
                type="button"
                onClick={onToggleVoice}
                className="w-9 h-9 rounded-full text-[#4B2859] hover:bg-[#F0EAF4] flex items-center justify-center transition-all cursor-pointer shrink-0"
                title="Voice conversation"
                aria-label="Start voice conversation"
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* Rightmost: Send Button */}
              <button
                type="submit"
                disabled={!text.trim()}
                className="w-9 h-9 rounded-full bg-[#4B2859] hover:bg-[#381E43] disabled:opacity-30 disabled:hover:bg-[#4B2859] text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-2xs"
                title="Send message"
                aria-label="Send message"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
