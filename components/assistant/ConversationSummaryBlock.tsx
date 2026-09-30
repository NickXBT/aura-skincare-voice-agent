"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Copy, Check, Terminal } from "lucide-react";
import { CallIntelligenceReport } from "@/lib/agent/call-summary";

interface ConversationSummaryBlockProps {
  report: CallIntelligenceReport;
}

export const ConversationSummaryBlock: React.FC<ConversationSummaryBlockProps> = ({ report }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const { outcome, sentiment } = report;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="my-6 rounded-2xl bg-[#FAF9FB] border border-[#E9E5EB] p-5 max-w-lg text-left shadow-2xs">
      <div className="flex items-center justify-between pb-3 border-b border-[#E9E5EB]">
        <h4 className="font-serif font-bold text-sm tracking-tight text-[#17131A]">
          Conversation summary
        </h4>
        <span
          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
            outcome.resolution_status === "RESOLVED"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : outcome.resolution_status === "OUT_OF_SCOPE"
              ? "bg-[#F0EAF4] text-[#4B2859] border border-[#4B2859]/20"
              : "bg-amber-50 text-amber-800 border border-amber-200"
          }`}
        >
          {outcome.resolution_status.replace(/_/g, " ")}
        </span>
      </div>

      <div className="py-3 text-xs space-y-2 text-[#716A77]">
        <div className="flex justify-between">
          <span className="font-medium text-[#716A77]">Intent:</span>
          <span className="font-semibold text-[#17131A]">
            {outcome.customer_intent.replace(/_/g, " ")}
          </span>
        </div>

        {outcome.order_id && (
          <div className="flex justify-between">
            <span className="font-medium text-[#716A77]">Order:</span>
            <span className="font-mono font-semibold text-[#17131A]">{outcome.order_id}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="font-medium text-[#716A77]">Customer Tone:</span>
          <span className="font-medium text-[#4B2859]">{sentiment}</span>
        </div>

        <div className="pt-2 border-t border-[#E9E5EB]/60">
          <span className="font-medium text-[#716A77] block mb-1">Summary:</span>
          <p className="text-[#17131A] leading-relaxed font-normal">
            {outcome.call_summary}
          </p>
        </div>
      </div>

      {/* Subtle Dev / Technical Details Accordion */}
      <div className="mt-2 pt-2 border-t border-[#E9E5EB]/60">
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center justify-between w-full text-[11px] text-[#716A77] hover:text-[#17131A] font-medium transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Terminal className="w-3 h-3" />
            <span>Technical details</span>
          </span>
          {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {showDetails && (
          <div className="mt-2 p-3 bg-white rounded-xl border border-[#E9E5EB] font-mono text-[10px] text-[#17131A] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[#716A77]">JSON Evaluation</span>
              <button
                onClick={handleCopyJson}
                className="flex items-center gap-1 text-[#4B2859] hover:underline"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <pre className="overflow-x-auto leading-relaxed max-h-48 text-[10px]">
              {JSON.stringify(report, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
