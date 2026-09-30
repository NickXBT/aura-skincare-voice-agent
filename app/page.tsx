"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { LandingHero } from "@/components/landing/LandingHero";
import { VoiceCallScreen } from "@/components/call/VoiceCallScreen";
import { ChatScreen } from "@/components/chat/ChatScreen";
import { TestOrdersModal } from "@/components/assistant/TestOrdersModal";
import { EvaluatorGuideModal } from "@/components/assistant/EvaluatorGuideModal";
import { AgentState } from "@/components/VoiceVisualizer";
import { VoiceRecognizer } from "@/lib/voice/speech-recognition";
import { VoiceSynthesizer } from "@/lib/voice/speech-synthesis";
import { AudioAmplitudeTracker } from "@/lib/voice/audio-analyser";
import { Message, ChatResponse } from "@/lib/agent/chat-engine";
import { ToolCallResult } from "@/lib/tools/order-tool";
import { CallIntelligenceReport, generateCallSummary } from "@/lib/agent/call-summary";
import {
  StoredConversation,
  loadStoredConversations,
  saveStoredConversation,
  deleteStoredConversation,
  generateConversationTitle,
} from "@/lib/storage/conversations";

export default function Home() {
  // App Navigation: "landing" | "talk" | "chat"
  const [currentMode, setCurrentMode] = useState<"landing" | "talk" | "chat">("landing");

  // Modals
  const [ordersModalOpen, setOrdersModalOpen] = useState(false);
  const [guideModalOpen, setGuideModalOpen] = useState(false);

  // Shared Conversation & Context
  const [messages, setMessages] = useState<Message[]>([]);
  const [accumulatedToolCalls, setAccumulatedToolCalls] = useState<ToolCallResult[]>([]);
  const [postCallReport, setPostCallReport] = useState<CallIntelligenceReport | null>(null);
  const [conversations, setConversations] = useState<StoredConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // Voice Call States
  const [agentState, setAgentState] = useState<AgentState>("idle");
  const [isCallActive, setIsCallActive] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [micAmplitude, setMicAmplitude] = useState<number>(0);

  // Audio / Speech Refs
  const recognizerRef = useRef<VoiceRecognizer | null>(null);
  const synthesizerRef = useRef<VoiceSynthesizer | null>(null);
  const audioTrackerRef = useRef<AudioAmplitudeTracker | null>(null);
  const messagesRef = useRef<Message[]>(messages);
  messagesRef.current = messages;

  const isCallActiveRef = useRef<boolean>(isCallActive);
  isCallActiveRef.current = isCallActive;

  // Load conversations on mount
  useEffect(() => {
    const stored = loadStoredConversations();
    setConversations(stored);
  }, []);

  // Initialize Speech Synthesis and Audio Amplitude Tracker
  useEffect(() => {
    const synth = new VoiceSynthesizer({
      onStart: () => {
        setAgentState("speaking");
      },
      onEnd: () => {
        // Continuous Conversation: automatically return to Listening
        if (isCallActiveRef.current) {
          setAgentState("listening");
          try {
            recognizerRef.current?.start();
          } catch {}
        } else {
          setAgentState("idle");
        }
      },
      onError: (err) => {
        console.warn("TTS Notice:", err);
        if (isCallActiveRef.current) {
          setAgentState("listening");
        }
      },
    });
    synthesizerRef.current = synth;

    audioTrackerRef.current = new AudioAmplitudeTracker((vol) => {
      setMicAmplitude(vol);
    });

    return () => {
      synth.cancel();
      audioTrackerRef.current?.stop();
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
    };
  }, []);

  // Shared Message Sender (Used by both Chat and Voice Call)
  const handleSendMessage = useCallback(
    async (userText: string, isVoiceTurn: boolean = false) => {
      if (!userText.trim()) return;

      // Barge-in: interrupt ongoing speech immediately
      if (synthesizerRef.current?.speaking) {
        synthesizerRef.current.cancel();
      }

      setAgentState("thinking");

      const userMsg: Message = {
        role: "user",
        content: userText.trim(),
        timestamp: Date.now(),
      };

      const updatedHistory = [...messagesRef.current, userMsg];
      setMessages(updatedHistory);

      // Manage active stored conversation
      let currentId = activeConversationId;
      if (!currentId) {
        currentId = `conv-${Date.now()}`;
        setActiveConversationId(currentId);
        const title = generateConversationTitle(userText);
        const newConv: StoredConversation = {
          id: currentId,
          title,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: updatedHistory,
        };
        saveStoredConversation(newConv);
        setConversations(loadStoredConversations());
      }

      try {
        const res = await fetch("/api/agent/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: updatedHistory }),
        });

        if (!res.ok) throw new Error("Server error");

        const data: ChatResponse = await res.json();
        const replyText = data.reply;

        if (data.toolCallsExecuted && data.toolCallsExecuted.length > 0) {
          setAccumulatedToolCalls((prev) => [...prev, ...data.toolCallsExecuted]);
        }

        const assistantMsg: Message = {
          role: "assistant",
          content: replyText,
          timestamp: Date.now(),
          toolCall:
            data.toolCallsExecuted && data.toolCallsExecuted.length > 0
              ? {
                  name: data.toolCallsExecuted[0].tool,
                  arguments: { order_id: data.toolCallsExecuted[0].orderId },
                  result: data.toolCallsExecuted[0],
                }
              : undefined,
        };

        const finalHistory = [...updatedHistory, assistantMsg];
        setMessages(finalHistory);

        // Update stored conversation
        if (currentId) {
          const convToUpdate: StoredConversation = {
            id: currentId,
            title:
              conversations.find((c) => c.id === currentId)?.title ||
              generateConversationTitle(userText),
            createdAt:
              conversations.find((c) => c.id === currentId)?.createdAt || Date.now(),
            updatedAt: Date.now(),
            messages: finalHistory,
            report: postCallReport || undefined,
          };
          saveStoredConversation(convToUpdate);
          setConversations(loadStoredConversations());
        }

        // Voice playback if in Voice Call mode or voice turn
        if (synthesizerRef.current && (isCallActiveRef.current || isVoiceTurn)) {
          synthesizerRef.current.speak(replyText);
        } else {
          setAgentState("idle");
        }
      } catch (err) {
        console.error("Agent chat error:", err);
        setAgentState(isCallActiveRef.current ? "listening" : "idle");
      }
    },
    [activeConversationId, conversations, postCallReport]
  );

  // Initialize Speech Recognizer
  const initializeRecognizer = useCallback(() => {
    if (recognizerRef.current) {
      recognizerRef.current.stop();
    }

    const rec = new VoiceRecognizer({
      onStart: () => {
        if (!synthesizerRef.current?.speaking) {
          setAgentState("listening");
        }
      },
      onSpeechStart: () => {
        // Real-time interruption / barge-in
        if (synthesizerRef.current?.speaking) {
          synthesizerRef.current.cancel();
          setAgentState("listening");
        }
      },
      onResult: (transcript, isFinal) => {
        if (isFinal && transcript.trim()) {
          handleSendMessage(transcript, true);
        }
      },
      onError: (err) => {
        console.warn("Recognizer notice:", err);
      },
      onEnd: () => {
        if (isCallActiveRef.current) {
          try {
            recognizerRef.current?.start();
          } catch {}
        }
      },
    });

    recognizerRef.current = rec;
  }, [handleSendMessage]);

  // Start Real Browser Phone Call Flow
  const handleStartCall = async () => {
    setPermissionError(null);
    setIsConnecting(true);

    try {
      // 1. Request microphone & initialize AudioContext
      const micStarted = await audioTrackerRef.current?.start();
      if (!micStarted) {
        setIsConnecting(false);
        setPermissionError(
          "Microphone access is needed to talk with ARIA. Please allow microphone permission."
        );
        return;
      }

      // 2. Initialize Speech Recognizer
      initializeRecognizer();

      // 3. Mark call active
      setIsConnecting(false);
      setIsCallActive(true);
      isCallActiveRef.current = true;
      setPostCallReport(null);

      // 4. Initial greeting spoken naturally aloud by ARIA
      const greetingTurn: Message = {
        role: "assistant",
        content: "Hi, I'm ARIA from Aura Skincare. How can I help you today?",
        timestamp: Date.now(),
      };

      setMessages((prev) => {
        const updated = [...prev, greetingTurn];
        return updated;
      });

      if (synthesizerRef.current) {
        synthesizerRef.current.speak(greetingTurn.content);
      } else {
        setAgentState("listening");
      }
    } catch (err: any) {
      setIsConnecting(false);
      setPermissionError("Could not access microphone: " + (err?.message || "Unknown error"));
    }
  };

  // End Call Handler
  const handleEndCall = () => {
    setIsCallActive(false);
    isCallActiveRef.current = false;
    setAgentState("ended");

    audioTrackerRef.current?.stop();
    setMicAmplitude(0);

    if (synthesizerRef.current) {
      synthesizerRef.current.cancel();
    }
    if (recognizerRef.current) {
      recognizerRef.current.stop();
    }

    // Generate post-call intelligence summary
    if (messagesRef.current.length > 0) {
      const report = generateCallSummary(messagesRef.current, accumulatedToolCalls);
      setPostCallReport(report);
    }
  };

  // New Conversation Handler
  const handleNewConversation = () => {
    if (synthesizerRef.current) synthesizerRef.current.cancel();
    if (recognizerRef.current) recognizerRef.current.stop();
    audioTrackerRef.current?.stop();

    setIsCallActive(false);
    isCallActiveRef.current = false;
    setAgentState("idle");
    setMicAmplitude(0);

    setMessages([]);
    setAccumulatedToolCalls([]);
    setPostCallReport(null);
    setActiveConversationId(null);
  };

  // Select an existing conversation from history
  const handleSelectConversation = (id: string) => {
    const target = conversations.find((c) => c.id === id);
    if (!target) return;

    if (synthesizerRef.current) synthesizerRef.current.cancel();
    if (recognizerRef.current) recognizerRef.current.stop();
    audioTrackerRef.current?.stop();

    setIsCallActive(false);
    isCallActiveRef.current = false;
    setAgentState("idle");
    setMicAmplitude(0);

    setActiveConversationId(target.id);
    setMessages(target.messages || []);
    setPostCallReport(target.report || null);
    setAccumulatedToolCalls([]);
  };

  // Delete Conversation Handler
  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteStoredConversation(id);
    setConversations(loadStoredConversations());
    if (activeConversationId === id) {
      handleNewConversation();
    }
  };

  return (
    <>
      {currentMode === "landing" ? (
        <LandingHero
          onStartTalk={() => setCurrentMode("talk")}
          onStartChat={() => setCurrentMode("chat")}
          onOpenOrders={() => setOrdersModalOpen(true)}
          onOpenGuide={() => setGuideModalOpen(true)}
        />
      ) : currentMode === "talk" ? (
        <VoiceCallScreen
          agentState={agentState}
          isCallActive={isCallActive}
          isConnecting={isConnecting}
          permissionError={permissionError}
          onStartCall={handleStartCall}
          onEndCall={handleEndCall}
          onBackToChat={() => setCurrentMode("chat")}
          onBackToHome={() => setCurrentMode("landing")}
          messages={messages}
          micAmplitude={micAmplitude}
          postCallReport={postCallReport}
          onStartNewCall={() => {
            handleNewConversation();
            handleStartCall();
          }}
        />
      ) : (
        <ChatScreen
          messages={messages}
          onSendMessage={(text) => handleSendMessage(text, false)}
          onSwitchToTalk={() => setCurrentMode("talk")}
          onBackToHome={() => setCurrentMode("landing")}
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          onOpenOrders={() => setOrdersModalOpen(true)}
          onOpenGuide={() => setGuideModalOpen(true)}
          postCallReport={postCallReport}
        />
      )}

      {/* Test Orders Modal */}
      <TestOrdersModal
        isOpen={ordersModalOpen}
        onClose={() => setOrdersModalOpen(false)}
        onSelectOrderPrompt={(orderId) => {
          setCurrentMode("chat");
          handleSendMessage(`Where is my order ${orderId}?`, false);
        }}
      />

      {/* Evaluator Guide Modal */}
      <EvaluatorGuideModal
        isOpen={guideModalOpen}
        onClose={() => setGuideModalOpen(false)}
        onSelectPrompt={(prompt) => {
          setCurrentMode("chat");
          handleSendMessage(prompt, false);
        }}
      />
    </>
  );
}
