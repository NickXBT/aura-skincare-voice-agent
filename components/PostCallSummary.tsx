"use client";

import React, { useState } from "react";
import { CallIntelligenceReport } from "@/lib/agent/call-summary";
import { Message } from "@/lib/agent/chat-engine";
import { ChevronDown, ChevronUp, Copy, Check } from "lucide-react";

interface PostCallSummaryProps {
  report: CallIntelligenceReport;
  messages: Message[];
  onStartNewCall: () => void;
}

export const PostCallSummary: React.FC<PostCallSummaryProps> = ({
  report,
  messages,
  onStartNewCall,
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
    <div className="w-full max-w-xl mx-auto py-8 px-4 animate-fade-in text-[#17131A]">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 mb-8 border-b border-[#EEE7F2]">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#241329] font-serif">
            Conversation Summary
          </h2>
          <p className="text-xs text-[#77717A] mt-1">
            Call completed • Aria Customer Support
          </p>
        </div>

        <button
          onClick={onStartNewCall}
          className="px-5 py-2.5 bg-[#241329] hover:bg-[#3B1F4A] text-white text-xs font-semibold rounded-full shadow-xs transition-all duration-200 cursor-pointer"
        >
          New Conversation
        </button>
      </div>

      {/* Main minimal summary cards */}
      <div className="space-y-4">
        {/* Customer Intent */}
        <div className="p-5 bg-white rounded-2xl border border-[#EEE7F2]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#77717A] block mb-1">
            Customer Intent
          </span>
          <span className="text-base font-bold text-[#241329]">
            {outcome.customer_intent.replace(/_/g, " ")}
          </span>
        </div>

        {/* Resolution Status & Order */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 bg-white rounded-2xl border border-[#EEE7F2]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#77717A] block mb-1">
              Resolution
            </span>
            <span
              className={`text-sm font-bold ${
                outcome.resolution_status === "RESOLVED"
                  ? "text-emerald-700"
                  : outcome.resolution_status === "OUT_OF_SCOPE"
                  ? "text-[#3B1F4A]"
                  : "text-amber-800"
              }`}
            >
              {outcome.resolution_status.replace(/_/g, " ")}
            </span>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-[#EEE7F2]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#77717A] block mb-1">
              Order
            </span>
            <span className="font-mono text-sm font-bold text-[#241329]">
              {outcome.order_id || "None Discussed"}
            </span>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="p-5 bg-white rounded-2xl border border-[#EEE7F2]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#77717A] block mb-1.5">
            Summary
          </span>
          <p className="text-sm leading-relaxed text-[#17131A]">
            {outcome.call_summary}
          </p>
        </div>
      </div>

      {/* Clean Expandable: View Transcript */}
      <div className="mt-6 border border-[#EEE7F2] rounded-2xl overflow-hidden bg-white">
        <button
          type="button"
          onClick={() => setShowTranscript(!showTranscript)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-left cursor-pointer hover:bg-[#FAF9F7] transition"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-[#241329]">
            View Transcript ({displayMessages.length} turns)
          </span>
          {showTranscript ? (
            <ChevronUp className="w-4 h-4 text-[#77717A]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#77717A]" />
          )}
        </button>

        {showTranscript && (
          <div className="p-5 border-t border-[#EEE7F2] bg-[#FAF9F7]/50 space-y-3.5 max-h-80 overflow-y-auto">
            {displayMessages.map((msg, i) => (
              <div key={i} className="text-xs leading-relaxed">
                <span className="font-bold text-[#241329]">
                  {msg.role === "user" ? "Customer: " : "Aria: "}
                </span>
                <span className="text-[#17131A]">{msg.content}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clean Expandable: View Technical Details */}
      <div className="mt-4 border border-[#EEE7F2] rounded-2xl overflow-hidden bg-white">
        <button
          type="button"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-left cursor-pointer hover:bg-[#FAF9F7] transition"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-[#241329]">
            View Technical Details
          </span>
          {showTechnicalDetails ? (
            <ChevronUp className="w-4 h-4 text-[#77717A]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#77717A]" />
          )}
        </button>

        {showTechnicalDetails && (
          <div className="p-5 border-t border-[#EEE7F2] bg-[#FAF9F7] space-y-4">
            {/* Operational Quality Specs */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-[#EEE7F2]">
                <span className="text-[#77717A] block text-[11px]">Observed Tone</span>
                <span className="font-bold text-[#241329]">{sentiment}</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-[#EEE7F2]">
                <span className="text-[#77717A] block text-[11px]">Tool Calls Executed</span>
                <span className="font-bold text-[#241329]">{agentQuality.toolCallsCount}</span>
              </div>
            </div>

            {/* Structured JSON */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-[#77717A] uppercase">
                  Structured Outcome JSON
                </span>
                <button
                  onClick={handleCopyJson}
                  className="flex items-center gap-1 text-[11px] text-[#3B1F4A] hover:text-[#241329] font-medium"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy JSON"}
                </button>
              </div>
              <pre className="p-4 bg-white rounded-xl border border-[#EEE7F2] font-mono text-[11px] text-[#17131A] overflow-x-auto">
                {JSON.stringify(outcome, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
