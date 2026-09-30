"use client";

import React, { useState } from "react";
import { CallIntelligenceReport } from "@/lib/agent/call-summary";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  HelpCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FileCode,
  ShieldCheck,
  Zap,
  Activity,
  Award,
} from "lucide-react";

interface PostCallIntelligenceProps {
  report: CallIntelligenceReport;
  onStartNewCall?: () => void;
}

export const PostCallIntelligence: React.FC<PostCallIntelligenceProps> = ({
  report,
  onStartNewCall,
}) => {
  const [copied, setCopied] = useState(false);
  const [jsonExpanded, setJsonExpanded] = useState(true);

  const { outcome, sentiment, agentQuality, generatedAt } = report;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(outcome, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getResolutionBadge = (status: string) => {
    switch (status) {
      case "RESOLVED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            RESOLVED
          </span>
        );
      case "PARTIALLY_RESOLVED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            PARTIALLY RESOLVED
          </span>
        );
      case "OUT_OF_SCOPE":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F7F3FA] text-[#4A2365] border border-[#E8DFED]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#6D3A91]" />
            OUT OF SCOPE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            UNRESOLVED
          </span>
        );
    }
  };

  const getSentimentBadge = (sent: string) => {
    switch (sent) {
      case "Positive":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            😊 Positive
          </span>
        );
      case "Frustrated":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            ⚠️ Frustrated
          </span>
        );
      case "Calm":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F7F3FA] text-[#2B123F] border border-[#E8DFED]">
            🌿 Calm
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200">
            ⚖️ Neutral
          </span>
        );
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-[#E8DFED] shadow-sm p-6 sm:p-8 mt-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E8DFED] gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#2B123F]" />
            <h2 className="text-xl font-bold tracking-tight text-[#2B123F] font-serif">
              Post-Call Intelligence & Analytics
            </h2>
          </div>
          <p className="text-xs text-[#6F6575] mt-1">
            Generated automatically upon call termination • {new Date(generatedAt).toLocaleTimeString()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {getResolutionBadge(outcome.resolution_status)}
          {onStartNewCall && (
            <button
              onClick={onStartNewCall}
              className="px-4 py-2 bg-[#2B123F] hover:bg-[#4A2365] text-white text-xs font-semibold rounded-full shadow-xs transition cursor-pointer"
            >
              Start New Call
            </button>
          )}
        </div>
      </div>

      {/* Grid: Customer Support Intelligence */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Left card: Core outcome & summary */}
        <div className="bg-[#F7F3FA]/70 rounded-2xl p-5 border border-[#E8DFED] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#4A2365]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#2B123F]">
                Customer Support Intelligence
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-[#E8DFED]/70">
                <span className="text-[#6F6575] font-medium">Customer Intent:</span>
                <span className="font-mono font-bold text-[#2B123F] bg-white px-2 py-0.5 rounded border border-[#E8DFED]">
                  {outcome.customer_intent}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-[#E8DFED]/70">
                <span className="text-[#6F6575] font-medium">Observed Sentiment:</span>
                {getSentimentBadge(sentiment)}
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-[#E8DFED]/70">
                <span className="text-[#6F6575] font-medium">Associated Order ID:</span>
                <span className="font-mono font-bold text-[#2B123F]">
                  {outcome.order_id || "None / Not Applicable"}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-[#E8DFED]/70">
                <span className="text-[#6F6575] font-medium">Follow-up Required:</span>
                <span
                  className={`font-semibold ${
                    outcome.follow_up_required ? "text-amber-700" : "text-emerald-700"
                  }`}
                >
                  {outcome.follow_up_required ? "Yes (Ticket logged)" : "No (Closed)"}
                </span>
              </div>
            </div>

            {/* AI Summary narrative */}
            <div className="mt-4 pt-3 border-t border-[#E8DFED]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6D3A91] block mb-1">
                Executive AI Call Summary:
              </span>
              <p className="text-xs text-[#1A1220] leading-relaxed bg-white p-3 rounded-xl border border-[#E8DFED]">
                {outcome.call_summary}
              </p>
            </div>
          </div>
        </div>

        {/* Right card: Operational Agent Quality Section */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8DFED] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-[#2B123F]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#2B123F]">
                Agent Quality & Operations
              </h3>
            </div>

            <p className="text-xs text-[#6F6575] mb-4">
              Real-time operational audit metrics evaluating tool usage, policy enforcement, and resolution fidelity.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-[#F7F3FA] border border-[#E8DFED]">
                <span className="text-[11px] text-[#6F6575] block">Conversation Turns</span>
                <span className="text-xl font-bold text-[#2B123F]">
                  {agentQuality.totalTurns}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#F7F3FA] border border-[#E8DFED]">
                <span className="text-[11px] text-[#6F6575] block">Tool Calls Executed</span>
                <span className="text-xl font-bold text-[#4A2365]">
                  {agentQuality.toolCallsCount}
                </span>
              </div>
            </div>

            {/* Operational Quality Checklist */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#F7F3FA]/50 border border-[#E8DFED]/70">
                <span className="text-[#1A1220]">Customer Issue Resolved</span>
                {agentQuality.issueResolved ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Yes
                  </span>
                ) : (
                  <span className="text-amber-700 font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-[#F7F3FA]/50 border border-[#E8DFED]/70">
                <span className="text-[#1A1220]">Guardrail Enforced / Scope Protected</span>
                {agentQuality.unsupportedRequestCorrectlyRejected ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Enforced
                  </span>
                ) : (
                  <span className="text-gray-500 font-semibold">Standard Scope</span>
                )}
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-[#F7F3FA]/50 border border-[#E8DFED]/70">
                <span className="text-[#1A1220]">Clarification Requested by Agent</span>
                <span className="text-[#4A2365] font-semibold">
                  {agentQuality.agentNeededClarification ? "Yes (ID Verification)" : "No (Direct)"}
                </span>
              </div>
            </div>
          </div>

          {/* Key Topics & Actions */}
          <div className="mt-4 pt-3 border-t border-[#E8DFED] space-y-2">
            <div>
              <span className="text-[11px] font-bold text-[#6F6575] uppercase block mb-1">
                Actions Performed:
              </span>
              <ul className="list-disc list-inside text-xs text-[#2B123F] space-y-0.5">
                {outcome.actions_taken.map((action, i) => (
                  <li key={i}>{action}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Structured JSON Output Viewer */}
      <div className="mt-6 border border-[#E8DFED] rounded-2xl overflow-hidden bg-[#F7F3FA]">
        <div
          onClick={() => setJsonExpanded(!jsonExpanded)}
          className="px-5 py-3 bg-[#F7F3FA] border-b border-[#E8DFED] flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-[#4A2365]" />
            <span className="text-xs font-bold text-[#2B123F] uppercase tracking-wider">
              Structured Call Outcome (JSON Format)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopyJson();
              }}
              className="flex items-center gap-1 text-[11px] font-medium text-[#4A2365] hover:text-[#2B123F] bg-white px-2.5 py-1 rounded-md border border-[#E8DFED] transition shadow-2xs"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>
            {jsonExpanded ? (
              <ChevronUp className="w-4 h-4 text-[#6F6575]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#6F6575]" />
            )}
          </div>
        </div>

        {jsonExpanded && (
          <pre className="p-4 text-xs font-mono text-[#2B123F] overflow-x-auto leading-relaxed max-h-72 bg-[#F7F3FA]/80">
            {JSON.stringify(outcome, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};
