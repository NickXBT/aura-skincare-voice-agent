"use client";

import React, { useEffect, useRef } from "react";
import { Message } from "@/lib/agent/chat-engine";
import { Bot, User, Wrench, Clock } from "lucide-react";

interface TranscriptViewProps {
  messages: Message[];
  isCallActive: boolean;
}

export const TranscriptView: React.FC<TranscriptViewProps> = ({ messages, isCallActive }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const displayMessages = messages.filter((m) => m.role === "user" || m.role === "assistant");

  return (
    <div className="w-full bg-white rounded-2xl border border-[#E8DFED] shadow-sm overflow-hidden flex flex-col h-[460px]">
      {/* Transcript Header */}
      <div className="px-5 py-3.5 bg-[#F7F3FA] border-b border-[#E8DFED] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#6D3A91]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#2B123F]">
            Real-Time Conversation Transcript
          </h3>
        </div>
        <span className="text-[11px] font-medium text-[#6F6575]">
          {displayMessages.length} turns recorded
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 p-5 overflow-y-auto space-y-4 bg-white">
        {displayMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#6F6575]">
            <div className="w-12 h-12 rounded-full bg-[#F7F3FA] border border-[#E8DFED] flex items-center justify-center mb-3 text-[#6D3A91]">
              <Bot className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-[#2B123F]">No messages yet</p>
            <p className="text-xs text-[#6F6575] mt-1 max-w-xs">
              Click <span className="font-semibold text-[#2B123F]">Start Call</span> to begin speaking with Aria. Your spoken conversation will transcribe in real time here.
            </p>
          </div>
        ) : (
          displayMessages.map((msg, index) => {
            const isUser = msg.role === "user";

            return (
              <div
                key={index}
                className={`flex gap-3 text-left ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-semibold shadow-xs ${
                    isUser
                      ? "bg-[#E8DFED] text-[#1A1220]"
                      : "bg-[#2B123F] text-white"
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble Container */}
                <div className={`flex flex-col max-w-[82%] sm:max-w-[75%] ${isUser ? "items-end" : "items-start"}`}>
                  {/* Sender Name */}
                  <span
                    className={`text-[11px] font-semibold mb-1 px-1 ${
                      isUser ? "text-[#1A1220]" : "text-[#2B123F]"
                    }`}
                  >
                    {isUser ? "You (Customer)" : "Aria (Aura Skincare Specialist)"}
                  </span>

                  {/* Bubble */}
                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed transition-all ${
                      isUser
                        ? "bg-[#F7F3FA] text-[#1A1220] rounded-tr-xs border border-[#E8DFED]/70"
                        : "bg-white text-[#1A1220] rounded-tl-xs border border-[#E8DFED] shadow-[0_2px_8px_-2px_rgba(43,18,63,0.04)]"
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Inline Tool Execution Indicator if agent ran get_order_details */}
                  {msg.toolCall && (
                    <div className="mt-1.5 flex items-center gap-1.5 px-2.5 py-1 bg-[#F7F3FA] border border-[#E8DFED] rounded-lg text-[10px] text-[#4A2365] font-mono">
                      <Wrench className="w-3 h-3 text-[#6D3A91]" />
                      <span>
                        Tool: {msg.toolCall.name} (order: {msg.toolCall.arguments?.order_id})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
