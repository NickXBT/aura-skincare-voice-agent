"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CallIntelligenceReport } from "@/lib/agent/call-summary";
import { Message } from "@/lib/agent/chat-engine";
import { ChevronDown, ChevronUp, Copy, Check, ArrowRight } from "lucide-react";

interface LuxuryPostCallProps {
  report: CallIntelligenceReport;
  messages: Message[];
  onStartNewConversation: () => void;
}

export const LuxuryPostCall: React.FC<LuxuryPostCallProps> = ({
  report,
  messages,
  onStartNewConversation,
}) => {
  const [showTranscript, setShowTranscript] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const { outcome, sentiment, agentQuality } = report;
  const displayMessages = messages.filter((m) => m.role === "user" || m.role === "assistant");

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-xl mx-auto py-8 text-[#17131A] text-left"
    >
      {/* Top Banner Heading */}
      <div className="mb-8">
        <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#746C78] block mb-2">
          Call Completed
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#241329] font-serif leading-none">
          CONVERSATION<br />COMPLETE
        </h1>
      </div>

      {/* Main High-Impact Summary Card */}
      <div className="p-7 bg-white rounded-3xl border border-[#EDE5F2] shadow-[0_8px_30px_-6px_rgba(36,19,41,0.06)] space-y-6">
        {/* Intent & Resolution Header */}
        <div className="flex items-start justify-between border-b border-[#EDE5F2] pb-5">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#746C78] block mb-1">
              Customer Intent
            </span>
            <span className="text-2xl font-extrabold text-[#241329] tracking-tight">
              {outcome.customer_intent.replace(/_/g, " ")}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#746C78] block mb-1">
              Resolution
            </span>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                outcome.resolution_status === "RESOLVED"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : outcome.resolution_status === "OUT_OF_SCOPE"
                  ? "bg-[#EDE5F2] text-[#3B1F4A]"
                  : "bg-amber-50 text-amber-800"
              }`}
            >
              {outcome.resolution_status.replace(/_/g, " ")}
            </span>
          </div>
        </div>

        {/* Order ID if present */}
        {outcome.order_id && (
          <div className="flex items-center justify-between py-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#746C78]">
              Order ID
            </span>
            <span className="font-mono text-base font-bold text-[#241329] bg-[#FAF8F5] px-3 py-0.5 rounded-lg border border-[#EDE5F2]">
              {outcome.order_id}
            </span>
          </div>
        )}

        {/* Narrative Summary */}
        <div className="pt-2">
          <p className="text-base text-[#17131A] leading-relaxed font-normal">
            "{outcome.call_summary}"
          </p>
        </div>
      </div>

      {/* Conversation Insights */}
      <div className="mt-8 p-6 bg-white rounded-3xl border border-[#EDE5F2]">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#241329] mb-4">
          Conversation Insights
        </h3>

        <div className="space-y-3 text-xs">
          <div className="flex justify-between py-1.5 border-b border-[#EDE5F2]/70">
            <span className="text-[#746C78]">Intent:</span>
            <span className="font-semibold text-[#241329]">
              {outcome.customer_intent.replace(/_/g, " ")}
            </span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-[#EDE5F2]/70">
            <span className="text-[#746C78]">Resolution:</span>
            <span className="font-semibold text-[#241329]">
              {outcome.resolution_status.replace(/_/g, " ")}
            </span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-[#EDE5F2]/70">
            <span className="text-[#746C78]">Order:</span>
            <span className="font-mono font-semibold text-[#241329]">
              {outcome.order_id || "None Discussed"}
            </span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-[#EDE5F2]/70">
            <span className="text-[#746C78]">Observed Tone:</span>
            <span className="font-semibold text-[#3B1F4A]">
              {sentiment}
            </span>
          </div>

          <div className="flex justify-between py-1.5">
            <span className="text-[#746C78]">Follow-up Required:</span>
            <span className="font-semibold text-[#241329]">
              {outcome.follow_up_required ? "Yes (Ticket logged)" : "No"}
            </span>
          </div>
        </div>
      </div>

      {/* Expandable: VIEW TRANSCRIPT */}
      <div className="mt-4 bg-white rounded-2xl border border-[#EDE5F2] overflow-hidden">
        <button
          type="button"
          onClick={() => setShowTranscript(!showTranscript)}
          className="w-full px-6 py-4 flex items-center justify-between text-left cursor-pointer hover:bg-[#FAF8F5] transition"
        >
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#241329]">
            View Transcript ({displayMessages.length} turns)
          </span>
          {showTranscript ? <ChevronUp className="w-4 h-4 text-[#746C78]" /> : <ChevronDown className="w-4 h-4 text-[#746C78]" />}
        </button>

        {showTranscript && (
          <div className="px-6 pb-6 pt-2 border-t border-[#EDE5F2] bg-[#FAF8F5]/40 space-y-3.5 max-h-80 overflow-y-auto">
            {displayMessages.map((msg, i) => (
              <div key={i} className="text-xs leading-relaxed">
                <span className="font-bold text-[#241329] uppercase tracking-wider text-[11px]">
                  {msg.role === "user" ? "You: " : "Aria: "}
                </span>
                <span className="text-[#17131A]">{msg.content}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expandable: VIEW TECHNICAL DETAILS (JSON hidden here) */}
      <div className="mt-4 bg-white rounded-2xl border border-[#EDE5F2] overflow-hidden">
        <button
          type="button"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="w-full px-6 py-4 flex items-center justify-between text-left cursor-pointer hover:bg-[#FAF8F5] transition"
        >
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#241329]">
            View Technical Details
          </span>
          {showTechnicalDetails ? <ChevronUp className="w-4 h-4 text-[#746C78]" /> : <ChevronDown className="w-4 h-4 text-[#746C78]" />}
        </button>

        {showTechnicalDetails && (
          <div className="p-6 border-t border-[#EDE5F2] bg-[#FAF8F5] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#746C78] uppercase tracking-wider">
                Raw JSON Outcome
              </span>
              <button
                onClick={handleCopyJson}
                className="flex items-center gap-1 text-[11px] text-[#3B1F4A] hover:text-[#241329] font-medium"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy JSON"}
              </button>
            </div>

            <pre className="p-4 bg-white rounded-xl border border-[#EDE5F2] font-mono text-[11px] text-[#17131A] overflow-x-auto">
              {JSON.stringify(report, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Primary Bottom Action */}
      <div className="mt-8 text-center">
        <button
          onClick={onStartNewConversation}
          className="px-10 py-4 bg-[#241329] hover:bg-[#3B1F4A] text-white text-sm font-bold tracking-wider rounded-full shadow-[0_4px_20px_-4px_rgba(36,19,41,0.3)] transition cursor-pointer"
        >
          START NEW CONVERSATION
        </button>
      </div>
    </motion.div>
  );
};
