"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, CheckCircle2 } from "lucide-react";

interface EvaluatorGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt?: (prompt: string) => void;
}

export const EvaluatorGuideModal: React.FC<EvaluatorGuideModalProps> = ({
  isOpen,
  onClose,
  onSelectPrompt,
}) => {
  const categories = [
    {
      title: "Order Tracking & Multi-Turn",
      prompts: [
        "Where is my order ORD-101?",
        "Can I cancel it?",
        "Which product did I order?",
      ],
    },
    {
      title: "Returns & Refund Policy",
      prompts: [
        "Can I return my sunscreen?",
        "I opened it 20 days ago, can I return it?",
        "I want my money back.",
      ],
    },
    {
      title: "Hinglish & Natural Language",
      prompts: [
        "mera order kaha hai?",
        "ye return ho sakta hai?",
        "the order I bought yesterday",
      ],
    },
    {
      title: "Policy Edge Cases & Scope Guardrails",
      prompts: [
        "What happens if my package is damaged?",
        "Can you book me a flight?",
        "Which order did I return?",
      ],
    },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-white rounded-3xl border border-[#E9E5EB] shadow-2xl p-6 overflow-hidden z-10 text-left max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#E9E5EB]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#F0EAF4] flex items-center justify-center text-[#4B2859]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-[#17131A]">Evaluator Testing Guide</h3>
                <p className="text-xs text-[#716A77]">Test conversational reasoning & voice interaction</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#716A77] hover:text-[#17131A] hover:bg-[#F0EAF4] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List of Prompt Categories */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {categories.map((cat, idx) => (
              <div key={idx} className="space-y-1.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#716A77]">
                  {cat.title}
                </h4>
                <div className="space-y-1.5">
                  {cat.prompts.map((p, pIdx) => (
                    <div
                      key={pIdx}
                      onClick={() => {
                        if (onSelectPrompt) onSelectPrompt(p);
                        onClose();
                      }}
                      className="p-2.5 rounded-xl bg-[#FAF9FB] border border-[#E9E5EB] hover:bg-[#F0EAF4] hover:border-[#4B2859]/30 text-xs font-medium text-[#17131A] transition-colors cursor-pointer flex items-center justify-between group"
                    >
                      <span>&ldquo;{p}&rdquo;</span>
                      <span className="opacity-0 group-hover:opacity-100 text-[11px] text-[#4B2859] font-semibold">
                        Try →
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#E9E5EB] text-center">
            <span className="text-xs text-[#716A77]">Click any prompt or speak it via the microphone</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
