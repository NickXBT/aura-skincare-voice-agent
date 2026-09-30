"use client";

import React from "react";
import { CheckCircle, PhoneCall, HelpCircle, PhoneOff, FileText, ArrowRight } from "lucide-react";

export const EvaluationGuide: React.FC = () => {
  const steps = [
    {
      num: 1,
      title: "Start Call",
      desc: "Click the START CALL button & allow microphone access.",
      icon: PhoneCall,
    },
    {
      num: 2,
      title: "Ask about ORD-101",
      desc: 'Say: "Where is my order ORD-101?" to test tool calling.',
      icon: CheckCircle,
    },
    {
      num: 3,
      title: "Test Policy or Boundary",
      desc: 'Ask: "Can I return an opened cream from 20 days ago?" or "Book a flight to Goa".',
      icon: HelpCircle,
    },
    {
      num: 4,
      title: "End Call",
      desc: "Click END CALL to close the voice session.",
      icon: PhoneOff,
    },
    {
      num: 5,
      title: "Review Summary",
      desc: "Inspect live transcript, sentiment, operational quality & structured JSON outcome.",
      icon: FileText,
    },
  ];

  return (
    <div className="w-full bg-white rounded-2xl border border-[#E8DFED] p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3 border-b border-[#E8DFED] pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2B123F]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#2B123F]">
            Evaluator 2-Minute Quick Guide
          </h3>
        </div>
        <span className="text-[11px] text-[#6F6575] font-medium">
          Fast-track walkthrough
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.num}
              className="p-3 rounded-xl bg-[#F7F3FA] border border-[#E8DFED]/80 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#2B123F] text-white text-[11px] font-bold flex items-center justify-center">
                    {step.num}
                  </span>
                  <Icon className="w-3.5 h-3.5 text-[#6D3A91]" />
                </div>
                <h4 className="text-xs font-bold text-[#2B123F] mb-1">{step.title}</h4>
                <p className="text-[11px] text-[#6F6575] leading-relaxed">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
