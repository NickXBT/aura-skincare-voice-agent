"use client";

import React, { useEffect, useRef } from "react";
import { Message } from "@/lib/agent/chat-engine";

interface RecentConversationProps {
  messages: Message[];
  isCallActive: boolean;
}

export const RecentConversation: React.FC<RecentConversationProps> = ({ messages }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const displayMessages = messages.filter((m) => m.role === "user" || m.role === "assistant");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (displayMessages.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-xl mx-auto mt-12 pt-8 border-t border-[#EEE7F2]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#77717A]">
          Recent Conversation
        </h3>
        <span className="text-[11px] text-[#77717A]">
          {displayMessages.length} {displayMessages.length === 1 ? "turn" : "turns"}
        </span>
      </div>

      <div
        ref={scrollRef}
        className="space-y-4 max-h-72 overflow-y-auto pr-1"
      >
        {displayMessages.map((msg, idx) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={idx}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              <span className="text-[11px] font-semibold text-[#77717A] mb-1 px-1">
                {isUser ? "You" : "Aria"}
              </span>
              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed max-w-[85%] transition-all ${
                  isUser
                    ? "bg-[#EEE7F2] text-[#17131A] rounded-tr-xs"
                    : "bg-white text-[#17131A] rounded-tl-xs border border-[#EEE7F2] shadow-[0_2px_12px_-4px_rgba(23,19,26,0.04)]"
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
