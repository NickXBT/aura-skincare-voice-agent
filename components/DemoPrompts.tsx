"use client";

import React, { useState } from "react";
import { MessageSquare, Sparkles, Volume2, Check } from "lucide-react";

interface DemoPromptsProps {
  onSuggestPrompt?: (promptText: string) => void;
}

export const DemoPrompts: React.FC<DemoPromptsProps> = ({ onSuggestPrompt }) => {
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

  const prompts = [
    {
      label: "Order Status (ORD-101)",
      text: "Where is my order ORD-101?",
      category: "Tool Calling",
    },
    {
      label: "Eligible Cancellation (ORD-103)",
      text: "Can I cancel ORD-103?",
      category: "Cancellation",
    },
    {
      label: "Ineligible Cancellation (ORD-101)",
      text: "Cancel ORD-101.",
      category: "Cancellation Policy",
    },
    {
      label: "7-Day Return Policy Violation",
      text: "I bought this 20 days ago and opened it. Can I return it?",
      category: "Return Policy",
    },
    {
      label: "Shipping Threshold",
      text: "What is your shipping policy?",
      category: "Policy Info",
    },
    {
      label: "Cash on Delivery",
      text: "Do you offer COD?",
      category: "Payment Info",
    },
    {
      label: "Invalid Order (ORD-999)",
      text: "My order number is ORD-999.",
      category: "Error Guardrail",
    },
    {
      label: "Out-of-Scope Request",
      text: "Can you book me a flight to Goa?",
      category: "Scope Guardrail",
    },
  ];

  const handleClick = (text: string) => {
    setSelectedPrompt(text);
    onSuggestPrompt?.(text);
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-[#E8DFED] p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3 border-b border-[#E8DFED] pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#4A2365]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#2B123F]">
            Recommended Test Questions
          </h3>
        </div>
        <span className="text-[11px] text-[#6F6575] font-medium">
          Click to highlight suggested phrase
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {prompts.map((p, idx) => {
          const isSelected = selectedPrompt === p.text;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleClick(p.text)}
              className={`px-3 py-1.5 rounded-full text-xs transition-all duration-150 text-left border cursor-pointer ${
                isSelected
                  ? "bg-[#2B123F] text-white border-[#2B123F] shadow-xs"
                  : "bg-[#F7F3FA] text-[#1A1220] border-[#E8DFED] hover:border-[#6D3A91]/60 hover:bg-white"
              }`}
            >
              <span className="font-medium">"{p.text}"</span>
            </button>
          );
        })}
      </div>

      {selectedPrompt && (
        <div className="mt-4 p-3 rounded-xl bg-[#F7F3FA] border border-[#E8DFED] flex items-center justify-between animate-fade-in text-xs">
          <div className="flex items-center gap-2 text-[#2B123F]">
            <Volume2 className="w-4 h-4 text-[#6D3A91] shrink-0" />
            <span>
              <span className="font-semibold text-[#4A2365]">Suggested prompt to speak:</span>{" "}
              "{selectedPrompt}"
            </span>
          </div>
          <span className="text-[10px] text-[#6F6575] uppercase font-bold tracking-wider">
            Speak into microphone
          </span>
        </div>
      )}
    </div>
  );
};
