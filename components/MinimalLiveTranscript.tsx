"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Message } from "@/lib/agent/chat-engine";

interface MinimalLiveTranscriptProps {
  messages: Message[];
  isCallActive: boolean;
}

export const MinimalLiveTranscript: React.FC<MinimalLiveTranscriptProps> = ({
  messages,
  isCallActive,
}) => {
  const displayMessages = messages.filter((m) => m.role === "user" || m.role === "assistant");

  if (!isCallActive && displayMessages.length === 0) {
    return null;
  }

  // Show only the latest 2 turns (last user turn and last assistant turn)
  const recentTurns = displayMessages.slice(-2);
  if (recentTurns.length === 0) return null;

  return (
    <div className="w-full max-w-xl mx-auto my-4 px-4 text-center">
      <AnimatePresence mode="popLayout">
        {recentTurns.map((msg, idx) => {
          const isUser = msg.role === "user";

          return (
            <motion.div
              key={`${msg.role}-${idx}-${msg.timestamp || idx}`}
              initial={{ opacity: 0, y: 8, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.99 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`my-2 flex flex-col items-center ${
                isUser ? "text-[#706A74]" : "text-[#17131A]"
              }`}
            >
              {isUser ? (
                <p className="text-sm font-normal italic tracking-tight max-w-lg leading-relaxed text-[#706A74]">
                  &ldquo;{msg.content}&rdquo;
                </p>
              ) : (
                <p className="text-base sm:text-lg font-medium tracking-tight max-w-xl leading-relaxed text-[#17131A]">
                  {msg.content}
                </p>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
