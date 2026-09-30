"use client";

import React, { useState, useEffect } from "react";
import { Phone, ArrowLeft, Sparkles } from "lucide-react";
import { AssistantSidebar } from "@/components/assistant/AssistantSidebar";
import { AssistantHeader } from "@/components/assistant/AssistantHeader";
import { AssistantEmptyState } from "@/components/assistant/AssistantEmptyState";
import { AssistantMessageList } from "@/components/assistant/AssistantMessageList";
import { AssistantComposer } from "@/components/assistant/AssistantComposer";
import { Message } from "@/lib/agent/chat-engine";
import { CallIntelligenceReport } from "@/lib/agent/call-summary";
import { StoredConversation } from "@/lib/storage/conversations";

interface ChatScreenProps {
  messages: Message[];
  onSendMessage: (text: string) => Promise<void>;
  onSwitchToTalk: () => void;
  onBackToHome: () => void;
  conversations: StoredConversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string, e: React.MouseEvent) => void;
  onOpenOrders: () => void;
  onOpenGuide: () => void;
  postCallReport: CallIntelligenceReport | null;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  messages,
  onSendMessage,
  onSwitchToTalk,
  onBackToHome,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onOpenOrders,
  onOpenGuide,
  postCallReport,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-[#17131A] font-sans selection:bg-[#F0EAF4] selection:text-[#4B2859]">
      {/* 1. Collapsible Sidebar */}
      <AssistantSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={onSelectConversation}
        onNewConversation={onNewConversation}
        onDeleteConversation={onDeleteConversation}
        onOpenTestOrders={onOpenOrders}
        onOpenGuide={onOpenGuide}
        isMobile={isMobile}
      />

      {/* 2. Main Canvas */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white relative">
        {/* Custom Header for Chat Mode */}
        <header className="w-full h-14 border-b border-[#E9E5EB]/60 bg-white/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToHome}
              className="p-1.5 rounded-lg text-[#716A77] hover:text-[#17131A] hover:bg-[#F0EAF4] transition-colors cursor-pointer"
              title="Back to Landing Screen"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <AssistantHeader
              sidebarOpen={sidebarOpen}
              onToggleSidebar={() => setSidebarOpen(true)}
              agentState="idle"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Direct Switch to Talk Mode (Preserves Context!) */}
            <button
              onClick={onSwitchToTalk}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#4B2859] hover:bg-[#381E43] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
              title="Start real-time voice call with ARIA"
            >
              <Phone className="w-3.5 h-3.5 fill-current" />
              <span>Talk with ARIA</span>
            </button>
          </div>
        </header>

        {/* Scrollable Conversation Canvas */}
        <div className="flex-1 overflow-y-auto flex flex-col justify-between">
          {messages.length === 0 ? (
            <AssistantEmptyState
              onSelectPrompt={onSendMessage}
              agentState="idle"
            />
          ) : (
            <AssistantMessageList
              messages={messages}
              report={postCallReport}
              isCallActive={false}
            />
          )}

          {/* Bottom Floating Composer */}
          <div className="sticky bottom-0 w-full pt-2 bg-gradient-to-t from-white via-white/95 to-transparent">
            <AssistantComposer
              onSendMessage={onSendMessage}
              agentState="idle"
              isCallActive={false}
              onToggleVoice={onSwitchToTalk}
              onStopSpeaking={() => {}}
              amplitude={0}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
