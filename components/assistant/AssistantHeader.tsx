"use client";

import React from "react";
import { PanelLeftOpen, Menu, Sparkles, Volume2 } from "lucide-react";
import { AgentState } from "@/components/VoiceVisualizer";

interface AssistantHeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  agentState: AgentState;
}

export const AssistantHeader: React.FC<AssistantHeaderProps> = ({
  sidebarOpen,
  onToggleSidebar,
  agentState,
}) => {
  return (
    <header className="w-full h-14 border-b border-[#E9E5EB]/60 bg-white/70 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {/* Sidebar Toggle when collapsed */}
        {!sidebarOpen && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg text-[#716A77] hover:text-[#17131A] hover:bg-[#F0EAF4]/60 transition-colors cursor-pointer"
            title="Open sidebar"
            aria-label="Open sidebar"
          >
            <PanelLeftOpen className="w-4 h-4 hidden sm:block" />
            <Menu className="w-4 h-4 sm:hidden" />
          </button>
        )}

        <div className="flex items-center gap-2">
          <span className="font-serif font-bold tracking-wider text-base text-[#17131A]">
            ARIA
          </span>
          <span className="text-[10px] uppercase tracking-[0.22em] text-[#716A77] font-semibold border-l border-[#E9E5EB] pl-2">
            Skincare AI
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {agentState === "speaking" && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F0EAF4] text-[#4B2859] text-xs font-medium animate-pulse">
            <Volume2 className="w-3 h-3" />
            <span>Speaking</span>
          </div>
        )}
        {agentState === "listening" && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
            <span>Listening</span>
          </div>
        )}
      </div>
    </header>
  );
};
