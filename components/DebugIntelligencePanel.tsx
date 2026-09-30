"use client";

import React, { useState } from "react";
import { DebugPipelineInfo } from "@/lib/agent/chat-engine";
import { Bug, ChevronDown, ChevronUp } from "lucide-react";

interface DebugIntelligencePanelProps {
  debugInfo: DebugPipelineInfo | null;
}

export const DebugIntelligencePanel: React.FC<DebugIntelligencePanelProps> = ({ debugInfo }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!debugInfo) return null;

  return (
    <div className="w-full max-w-lg mx-auto mt-4 text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-2 px-4 flex items-center justify-between text-[11px] font-mono font-bold uppercase tracking-wider text-[#746C78] hover:text-[#241329] bg-white rounded-xl border border-[#EDE5F2] shadow-2xs transition cursor-pointer"
      >
        <span className="flex items-center gap-1.5">
          <Bug className="w-3.5 h-3.5 text-[#3B1F4A]" />
          Dev Pipeline Debug: {debugInfo.detectedIntent} ({Math.round(debugInfo.confidence * 100)}%)
        </span>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {isOpen && (
        <div className="mt-2 p-4 bg-[#FAF8F5] rounded-2xl border border-[#EDE5F2] font-mono text-[11px] text-[#17131A] space-y-2 animate-fade-in shadow-xs">
          <div className="flex justify-between border-b border-[#EDE5F2]/70 pb-1">
            <span className="text-[#746C78]">Detected Intent:</span>
            <span className="font-bold text-[#241329]">{debugInfo.detectedIntent}</span>
          </div>

          <div className="flex justify-between border-b border-[#EDE5F2]/70 pb-1">
            <span className="text-[#746C78]">Confidence:</span>
            <span className="font-bold text-emerald-700">{debugInfo.confidence.toFixed(2)}</span>
          </div>

          <div className="flex justify-between border-b border-[#EDE5F2]/70 pb-1">
            <span className="text-[#746C78]">Entities:</span>
            <span className="text-right text-[#241329]">
              {JSON.stringify(
                Object.fromEntries(
                  Object.entries(debugInfo.entities).filter(([_, v]) => v !== null && v !== false)
                )
              )}
            </span>
          </div>

          <div className="flex justify-between border-b border-[#EDE5F2]/70 pb-1">
            <span className="text-[#746C78]">Context Memory:</span>
            <span className="text-right text-[#241329]">
              {debugInfo.context.activeOrderId ? `Order: ${debugInfo.context.activeOrderId}` : "none"}
              {debugInfo.context.product ? ` | ${debugInfo.context.product}` : ""}
            </span>
          </div>

          <div className="flex justify-between border-b border-[#EDE5F2]/70 pb-1">
            <span className="text-[#746C78]">Order Required:</span>
            <span className="font-bold text-[#241329]">{debugInfo.orderRequired}</span>
          </div>

          <div className="flex justify-between border-b border-[#EDE5F2]/70 pb-1">
            <span className="text-[#746C78]">Order ID:</span>
            <span className="font-mono font-bold text-[#3B1F4A]">{debugInfo.orderId || "null"}</span>
          </div>

          <div className="flex justify-between border-b border-[#EDE5F2]/70 pb-1">
            <span className="text-[#746C78]">Tool Required:</span>
            <span className="font-bold text-[#241329]">{debugInfo.toolRequired}</span>
          </div>

          {debugInfo.toolUsed && (
            <div className="flex justify-between border-b border-[#EDE5F2]/70 pb-1">
              <span className="text-[#746C78]">Tool Executed:</span>
              <span className="font-bold text-[#3B1F4A]">{debugInfo.toolUsed}</span>
            </div>
          )}

          <div className="flex justify-between border-b border-[#EDE5F2]/70 pb-1">
            <span className="text-[#746C78]">Policy Required:</span>
            <span className="font-bold text-[#241329]">{debugInfo.policyRequired}</span>
          </div>

          <div className="flex justify-between border-b border-[#EDE5F2]/70 pb-1">
            <span className="text-[#746C78]">Pipeline Decision:</span>
            <span className="font-bold text-[#241329]">{debugInfo.decision}</span>
          </div>

          {debugInfo.policyDecision && (
            <div className="flex justify-between border-b border-[#EDE5F2]/70 pb-1">
              <span className="text-[#746C78]">Policy Reason:</span>
              <span className="text-amber-800">{debugInfo.policyDecision}</span>
            </div>
          )}

          <div className="flex justify-between pt-0.5 text-[10px] text-[#746C78]">
            <span>Latency:</span>
            <span>{debugInfo.executionTimeMs} ms</span>
          </div>
        </div>
      )}
    </div>
  );
};
