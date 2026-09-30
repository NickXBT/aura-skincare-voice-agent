"use client";

import React from "react";
import { Sparkles, Settings2, ShieldCheck, Zap } from "lucide-react";

interface HeaderProps {
  onOpenSettings: () => void;
  isCallActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, isCallActive }) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-sm border-b border-[#E8DFED] px-4 sm:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2B123F] flex items-center justify-center text-white shadow-sm ring-2 ring-[#E8DFED]">
            <span className="font-serif text-xl font-bold tracking-wider">A</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg font-bold tracking-tight text-[#2B123F]">
                AURA
              </span>
              <span className="text-xs uppercase tracking-widest text-[#6D3A91] font-semibold border-l border-[#E8DFED] pl-2">
                SKINCARE
              </span>
            </div>
            <p className="text-[11px] text-[#6F6575] font-medium leading-none mt-0.5">
              AI Customer Support • Voice Specialist Aria
            </p>
          </div>
        </div>

        {/* Status badges & controls */}
        <div className="flex items-center gap-2.5">
          {/* Live indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-[#F7F3FA] rounded-full border border-[#E8DFED] text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isCallActive ? "bg-emerald-500 animate-pulse" : "bg-[#6D3A91]"
              }`}
            />
            <span className="text-[#2B123F] font-medium">
              {isCallActive ? "Call in Progress" : "Aria Ready"}
            </span>
          </div>

          {/* Zero-Cost badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-[#F7F3FA] rounded-full border border-[#E8DFED] text-[11px] text-[#4A2365] font-medium">
            <Zap className="w-3.5 h-3.5 text-[#6D3A91]" />
            <span>₹0 Cost • Browser Native</span>
          </div>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#2B123F] bg-white hover:bg-[#F7F3FA] border border-[#E8DFED] hover:border-[#6D3A91]/50 rounded-lg transition-all shadow-sm"
            title="Configure Voice & API settings"
          >
            <Settings2 className="w-3.5 h-3.5 text-[#4A2365]" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};
