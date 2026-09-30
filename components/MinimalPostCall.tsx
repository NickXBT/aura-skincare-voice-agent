"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CallIntelligenceReport } from "@/lib/agent/call-summary";
import { Message } from "@/lib/agent/chat-engine";
import { ChevronDown, ChevronUp, Copy, Check, RotateCcw, Sparkles, MessageSquare, Terminal } from "lucide-react";

interface MinimalPostCallProps {
  report: CallIntelligenceReport;
  messages: Message[];
  onStartNewConversation: () => void;
}

export const MinimalPostCall: React.FC<MinimalPostCallProps> = ({
  report,
  messages,
  onStartNewConversation,
}) => {
  const [showTranscript, setShowTranscript] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const { outcome, sentiment, agentQuality } = report;
  const displayMessages = messages.filter((m) => m.role === "user" || m.role === "assistant");

  // Determine first user question
  const firstUserMessage = displayMessages.find((m) => m.role === "user")?.content || outcome.customer_intent.replace(/_/g, " ");

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-xl mx-auto py-6 sm:py-10 text-left"
    >
      {/* Editorial Header */}
      <div className="mb-6 text-center">
        <span className="inline-block text-[11px] font-semibold tracking-widest uppercase text-[#706A74] mb-1">
          Aura Care Intelligence
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-[#17131A]">
          Conversation Complete
        </h2>
        <p className="text-sm text-[#706A74] mt-1.5">
          Here is a summary of your inquiry and ARIA&apos;s resolution.
        </p>
      </div>

      {/* Main Resolution Card */}
      <div className="bg-white rounded-3xl border border-[#EEEAF0] p-6 sm:p-7 shadow-[0_8px_30px_-6px_rgba(50,24,63,0.05)] space-y-5">
        {/* Row 1: What you asked */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#706A74] block mb-1">
            What you asked
          </span>
          <p className="text-base font-medium text-[#17131A] leading-snug">
            &ldquo;{firstUserMessage}&rdquo;
          </p>
        </div>

        {/* Row 2: What ARIA found */}
        <div className="pt-3 border-t border-[#EEEAF0]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#706A74] block mb-1">
            What ARIA verified
          </span>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {outcome.order_id ? (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#FAF9FB] border border-[#EEEAF0] text-xs font-mono font-medium text-[#32183F]">
                Order {outcome.order_id}
              </span>
            ) : (
              <span className="text-xs text-[#706A74] italic">Standard store policy query</span>
            )}
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#EDE5F2] text-xs font-medium text-[#32183F]">
              {outcome.customer_intent.replace(/_/g, " ")}
            </span>
          </div>
        </div>

        {/* Row 3: Resolution & Tone */}
        <div className="pt-3 border-t border-[#EEEAF0] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#706A74] block mb-1">
              Resolution
            </span>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${
                outcome.resolution_status === "RESOLVED"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : outcome.resolution_status === "OUT_OF_SCOPE"
                  ? "bg-[#EDE5F2] text-[#32183F] border border-[#32183F]/20"
                  : "bg-amber-50 text-amber-800 border border-amber-200"
              }`}
            >
              {outcome.resolution_status.replace(/_/g, " ")}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#706A74] block mb-1">
              Tone & Quality
            </span>
            <span className="text-xs font-medium text-[#32183F] bg-[#FAF9FB] px-2.5 py-1 rounded-md border border-[#EEEAF0]">
              {sentiment}
            </span>
          </div>
        </div>

        {/* Row 4: Narrative Summary */}
        <div className="pt-3 border-t border-[#EEEAF0]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#706A74] block mb-1">
            Summary
          </span>
          <p className="text-sm text-[#17131A] leading-relaxed">
            {outcome.call_summary}
          </p>
        </div>
      </div>

      {/* Expandable Section 1: Full Transcript */}
      <div className="mt-4 bg-white rounded-2xl border border-[#EEEAF0] overflow-hidden">
        <button
          type="button"
          onClick={() => setShowTranscript(!showTranscript)}
          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-[#FAF9FB] transition-colors"
        >
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#17131A]">
            <MessageSquare className="w-4 h-4 text-[#706A74]" />
            Full Transcript ({displayMessages.length} turns)
          </span>
          {showTranscript ? (
            <ChevronUp className="w-4 h-4 text-[#706A74]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#706A74]" />
          )}
        </button>

        <AnimatePresence>
          {showTranscript && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-5 pb-5 pt-1 border-t border-[#EEEAF0] bg-[#FAF9FB]/50 space-y-3 max-h-72 overflow-y-auto"
            >
              {displayMessages.map((msg, i) => (
                <div key={i} className="text-xs space-y-0.5">
                  <div className="flex items-center gap-1.5 font-semibold text-[11px] tracking-wide text-[#706A74]">
                    <span
                      className={
                        msg.role === "assistant" ? "text-[#32183F] font-bold" : "text-[#17131A]"
                      }
                    >
                      {msg.role === "assistant" ? "ARIA" : "YOU"}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-[10px] text-zinc-400">
                      {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-[#17131A] leading-relaxed">{msg.content}</p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Expandable Section 2: Technical & Verification Details */}
      <div className="mt-3 bg-white rounded-2xl border border-[#EEEAF0] overflow-hidden">
        <button
          type="button"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-[#FAF9FB] transition-colors"
        >
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#17131A]">
            <Terminal className="w-4 h-4 text-[#706A74]" />
            Technical & Policy Details
          </span>
          {showTechnicalDetails ? (
            <ChevronUp className="w-4 h-4 text-[#706A74]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#706A74]" />
          )}
        </button>

        <AnimatePresence>
          {showTechnicalDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-5 border-t border-[#EEEAF0] bg-[#FAF9FB] space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#706A74] tracking-wide">
                  Structured Evaluation Schema
                </span>
                <button
                  onClick={handleCopyJson}
                  className="inline-flex items-center gap-1 text-[11px] text-[#32183F] hover:text-black font-medium px-2 py-1 rounded bg-white border border-[#EEEAF0]"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copied ? "Copied" : "Copy JSON"}
                </button>
              </div>

              <pre className="p-3.5 bg-white rounded-xl border border-[#EEEAF0] font-mono text-[11px] text-[#17131A] overflow-x-auto leading-relaxed">
                {JSON.stringify(report, null, 2)}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Restart Pill Button */}
      <div className="mt-8 flex justify-center">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStartNewConversation}
          className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#32183F] hover:bg-[#25122F] text-white text-sm font-medium tracking-tight shadow-[0_4px_20px_rgba(50,24,63,0.2)] transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Start new conversation</span>
        </motion.button>
      </div>
    </motion.div>
  );
};
