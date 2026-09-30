"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Message } from "@/lib/agent/chat-engine";
import { CallIntelligenceReport } from "@/lib/agent/call-summary";
import { OrderSummaryCard } from "@/components/assistant/OrderSummaryCard";
import { ConversationSummaryBlock } from "@/components/assistant/ConversationSummaryBlock";

interface AssistantMessageListProps {
  messages: Message[];
  report: CallIntelligenceReport | null;
  isCallActive: boolean;
}

export const AssistantMessageList: React.FC<AssistantMessageListProps> = ({
  messages,
  report,
  isCallActive,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const displayMessages = messages.filter((m) => m.role === "user" || m.role === "assistant");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, report]);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <AnimatePresence initial={false}>
        {displayMessages.map((msg, idx) => {
          const isUser = msg.role === "user";
          const order = msg.toolCall?.result?.order;

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              {isUser ? (
                /* User Message */
                <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl bg-[#F0EAF4] text-[#17131A] px-5 py-3.5 shadow-2xs">
                  <p className="text-[16px] sm:text-[17px] leading-relaxed font-normal">
                    {msg.content}
                  </p>
                </div>
              ) : (
                /* ARIA Message */
                <div className="max-w-[95%] sm:max-w-[85%] text-left space-y-2">
                  {/* ARIA Identity Header */}
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#4B2859]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="tracking-tight">ARIA</span>
                  </div>

                  {/* Text Content */}
                  <p className="text-[17px] sm:text-[18px] text-[#17131A] leading-relaxed font-normal">
                    {msg.content}
                  </p>

                  {/* Contextual Order Card if order exists */}
                  {order && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <OrderSummaryCard order={order} />
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Post-Call Conversation Summary Block */}
      {report && !isCallActive && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ConversationSummaryBlock report={report} />
        </motion.div>
      )}

      <div ref={bottomRef} className="h-4" />
    </div>
  );
};
