"use client";

import React from "react";
import { motion } from "framer-motion";
import { Phone, MessageSquare, Sparkles, Package, ShieldCheck, Clock } from "lucide-react";

interface LandingHeroProps {
  onStartTalk: () => void;
  onStartChat: () => void;
  onOpenOrders: () => void;
  onOpenGuide: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onStartTalk,
  onStartChat,
  onOpenOrders,
  onOpenGuide,
}) => {
  return (
    <div className="min-h-screen bg-white text-[#17131A] flex flex-col justify-between selection:bg-[#F0EAF4] selection:text-[#4B2859]">
      {/* Top Brand Header */}
      <header className="w-full px-6 sm:px-12 py-5 flex items-center justify-between border-b border-[#E9E5EB]/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#4B2859] flex items-center justify-center text-white shadow-xs">
            <span className="font-serif font-bold text-sm">A</span>
          </div>
          <span className="font-serif font-bold tracking-wider text-lg text-[#17131A]">
            AURA
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#716A77] border-l border-[#E9E5EB] pl-2.5">
            Skincare
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenOrders}
            className="px-3.5 py-1.5 rounded-full text-xs font-medium text-[#716A77] hover:text-[#17131A] hover:bg-[#FAF9FB] border border-[#E9E5EB] transition-colors cursor-pointer"
          >
            Sample Orders
          </button>
          <button
            onClick={onOpenGuide}
            className="px-3.5 py-1.5 rounded-full text-xs font-medium text-[#4B2859] hover:bg-[#F0EAF4] transition-colors cursor-pointer"
          >
            Evaluator Guide
          </button>
        </div>
      </header>

      {/* Main Hero Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 sm:py-20 flex flex-col items-center justify-center text-center">
        {/* Subtle AI Icon Visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="relative mb-6"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#32183F] via-[#4B2859] to-[#714187] flex items-center justify-center shadow-[0_8px_25px_-6px_rgba(75,40,89,0.35)]">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div className="absolute -inset-1 rounded-full bg-[#4B2859]/15 blur-md -z-10" />
        </motion.div>

        {/* Confident Hero Typography */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="space-y-3 max-w-2xl"
        >
          <h1 className="text-4xl sm:text-6xl font-serif font-bold tracking-tight text-[#17131A] leading-[1.1]">
            Hi, I&apos;m ARIA
          </h1>
          <p className="text-lg sm:text-xl font-sans font-medium text-[#4B2859] tracking-tight">
            Your Aura Skincare AI Support Assistant
          </p>
          <p className="text-sm sm:text-base text-[#716A77] font-normal max-w-lg mx-auto leading-relaxed pt-1">
            Real-time voice intelligence and chat support for order status tracking, returns, cancellations, and organic skincare guidance.
          </p>
        </motion.div>

        {/* Two Clear Choices: Talk with ARIA vs Chat with ARIA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
          className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md"
        >
          {/* Talk with ARIA (Primary) */}
          <button
            onClick={onStartTalk}
            className="w-full sm:w-auto flex-1 group flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-[#4B2859] hover:bg-[#381E43] active:scale-[0.98] text-white text-sm font-semibold tracking-wide shadow-[0_8px_25px_-6px_rgba(75,40,89,0.38)] transition-all cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Phone className="w-3.5 h-3.5 fill-current" />
            </div>
            <span>Talk with ARIA</span>
          </button>

          {/* Chat with ARIA (Secondary) */}
          <button
            onClick={onStartChat}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-[#FAF9FB] hover:bg-[#F0EAF4] active:scale-[0.98] border border-[#E9E5EB] text-[#17131A] text-sm font-semibold tracking-wide transition-all cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-[#4B2859]" />
            <span>Chat with ARIA</span>
          </button>
        </motion.div>

        {/* Feature Pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-14 pt-8 border-t border-[#E9E5EB]/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#716A77] max-w-xl w-full"
        >
          <div className="flex items-center justify-center gap-2">
            <Package className="w-4 h-4 text-[#4B2859]" />
            <span>Live Order Tracking</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#4B2859]" />
            <span>Instant Return Policies</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Clock className="w-4 h-4 text-[#4B2859]" />
            <span>Real Browser Mic & Audio</span>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full py-5 text-center text-xs text-[#716A77] border-t border-[#E9E5EB]/60">
        <p className="font-serif">Aura Skincare • AI Voice Customer Support Specialist</p>
      </footer>
    </div>
  );
};
