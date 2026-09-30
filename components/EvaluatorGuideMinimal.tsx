"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";

export const EvaluatorGuideMinimal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const prompts = [
    "Where is my order ORD-101?",
    "Can I cancel ORD-103?",
    "I opened it 20 days ago. Can I return it?",
    "What is your shipping policy?",
    "Do you offer COD?",
    "Tell me what's happening with my serum.",
    "Can you book me a flight to Goa?",
  ];

  return (
    <div className="w-full max-w-lg mx-auto mt-6">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-2.5 px-4 flex items-center justify-between text-xs font-bold uppercase tracking-[0.2em] text-[#746C78] hover:text-[#241329] transition cursor-pointer select-none"
      >
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#3B1F4A]" />
          Evaluator Guide
        </span>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="mt-2 p-4 bg-white rounded-2xl border border-[#EDE5F2] text-xs text-[#17131A] space-y-2 animate-fade-in shadow-xs">
          <p className="text-[#746C78] font-medium text-[11px] mb-2">
            Speak naturally to test intent recognition, multi-turn memory, and policy guardrails:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {prompts.map((p, idx) => (
              <div
                key={idx}
                className="p-2 rounded-xl bg-[#FAF8F5] border border-[#EDE5F2]/80 text-[#241329] text-[11px] font-medium"
              >
                "{p}"
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
