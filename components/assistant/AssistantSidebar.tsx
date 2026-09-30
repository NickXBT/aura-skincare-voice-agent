"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  MessageSquare,
  PanelLeftClose,
  Trash2,
  Package,
  Sparkles,
  Info,
  X,
} from "lucide-react";
import { StoredConversation, categorizeConversationDate } from "@/lib/storage/conversations";

interface AssistantSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  conversations: StoredConversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string, e: React.MouseEvent) => void;
  onOpenTestOrders: () => void;
  onOpenGuide: () => void;
  isMobile: boolean;
}

export const AssistantSidebar: React.FC<AssistantSidebarProps> = ({
  isOpen,
  onToggle,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onOpenTestOrders,
  onOpenGuide,
  isMobile,
}) => {
  // Group conversations
  const grouped: Record<"Today" | "Yesterday" | "Older", StoredConversation[]> = {
    Today: [],
    Yesterday: [],
    Older: [],
  };

  conversations.forEach((conv) => {
    const category = categorizeConversationDate(conv.updatedAt || conv.createdAt);
    grouped[category].push(conv);
  });

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#FAF9FB] border-r border-[#E9E5EB] select-none text-[#17131A] w-[260px] sm:w-[275px]">
      {/* 1. Header with ARIA wordmark & collapse button */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#4B2859] flex items-center justify-center text-white shadow-xs">
            <span className="font-serif font-bold text-xs">A</span>
          </div>
          <span className="font-serif font-bold tracking-wider text-base text-[#17131A]">
            ARIA
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#716A77] font-semibold border-l border-[#E9E5EB] pl-2">
            Aura
          </span>
        </div>

        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-[#716A77] hover:text-[#17131A] hover:bg-[#F0EAF4]/60 transition-colors cursor-pointer"
          title="Collapse sidebar"
          aria-label="Collapse sidebar"
        >
          {isMobile ? <X className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* 2. New Conversation Button */}
      <div className="px-3 py-2">
        <button
          onClick={onNewConversation}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white border border-[#E9E5EB] text-xs font-semibold text-[#17131A] hover:bg-[#F0EAF4]/50 hover:border-[#4B2859]/30 shadow-2xs transition-all duration-200 cursor-pointer group"
        >
          <div className="w-5 h-5 rounded-full bg-[#F0EAF4] flex items-center justify-center text-[#4B2859] group-hover:bg-[#4B2859] group-hover:text-white transition-colors">
            <Plus className="w-3.5 h-3.5" />
          </div>
          <span className="tracking-tight">New conversation</span>
        </button>
      </div>

      {/* 3. Conversation List (Grouped by Today, Yesterday, Older) */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {(["Today", "Yesterday", "Older"] as const).map((category) => {
          const items = grouped[category];
          if (items.length === 0) return null;

          return (
            <div key={category} className="space-y-1">
              <h3 className="px-3 text-[11px] font-semibold uppercase tracking-wider text-[#716A77]/80">
                {category}
              </h3>
              <div className="space-y-0.5">
                {items.map((conv) => {
                  const isActive = conv.id === activeConversationId;

                  return (
                    <div
                      key={conv.id}
                      onClick={() => onSelectConversation(conv.id)}
                      className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all duration-150 ${
                        isActive
                          ? "bg-[#F0EAF4] text-[#4B2859] font-semibold"
                          : "text-[#17131A]/90 hover:bg-white/80 hover:text-[#17131A]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <MessageSquare
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isActive ? "text-[#4B2859]" : "text-[#716A77]"
                          }`}
                        />
                        <span className="truncate tracking-tight">{conv.title}</span>
                      </div>

                      <button
                        onClick={(e) => onDeleteConversation(conv.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-[#716A77] hover:text-rose-600 hover:bg-rose-50 transition-opacity"
                        title="Delete chat"
                        aria-label="Delete chat"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Footer Utilities: Mock Orders & Evaluator Guide */}
      <div className="p-3 border-t border-[#E9E5EB] bg-[#FAF9FB] space-y-1">
        <button
          onClick={onOpenTestOrders}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#716A77] hover:text-[#17131A] hover:bg-white transition-colors cursor-pointer"
        >
          <Package className="w-3.5 h-3.5 text-[#4B2859]" />
          <span>Test Orders Data</span>
        </button>

        <button
          onClick={onOpenGuide}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#716A77] hover:text-[#17131A] hover:bg-white transition-colors cursor-pointer"
        >
          <Info className="w-3.5 h-3.5 text-[#4B2859]" />
          <span>Evaluation Guide</span>
        </button>
      </div>
    </div>
  );

  // Mobile Drawer Overlay
  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onToggle}
              className="fixed inset-0 bg-black/30 backdrop-blur-xs z-40"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="fixed inset-y-0 left-0 z-50 shadow-xl"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Desktop Collapsible Sidebar
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 275, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="shrink-0 h-screen overflow-hidden sticky top-0"
        >
          {sidebarContent}
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
