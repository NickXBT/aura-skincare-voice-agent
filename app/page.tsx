"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { LandingHero } from "@/components/landing/LandingHero";
import { VoiceCallScreen, DiagnosticInfo } from "@/components/call/VoiceCallScreen";
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
import {
  getAllMockOrders,
  getCancelledOrderIds,
  loadPersistedClientOrders,
  Order,
} from "@/lib/orders/database";

export default function Home() {
  // App Navigation: "landing" | "talk" | "chat"
  const [currentMode, setCurrentMode] = useState<"landing" | "talk" | "chat">("landing");

  // Modals
  const [ordersModalOpen, setOrdersModalOpen] = useState(false);
  const [guideModalOpen, setGuideModalOpen] = useState(false);

  // Live Synchronized Orders (Shared single source of truth across Chat, Talk, and Modals)
  const [orders, setOrders] = useState<Order[]>([]);

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
  const [liveInterimTranscript, setLiveInterimTranscript] = useState<string>("");
  const [ttsWarningMessage, setTtsWarningMessage] = useState<string | null>(null);

  // Audio / Speech Refs
  const recognizerRef = useRef<VoiceRecognizer | null>(null);
  const synthesizerRef = useRef<VoiceSynthesizer | null>(null);
  const audioTrackerRef = useRef<AudioAmplitudeTracker | null>(null);
  const messagesRef = useRef<Message[]>(messages);
  messagesRef.current = messages;

  const isCallActiveRef = useRef<boolean>(isCallActive);
  isCallActiveRef.current = isCallActive;

  // Load conversations and persisted orders on mount
  useEffect(() => {
    const stored = loadStoredConversations();
    setConversations(stored);

    // Synchronize client-side persistent cancellations from browser storage
    loadPersistedClientOrders();
    setOrders([...getAllMockOrders()]);

    const handleOrderCancelled = () => {
      setOrders([...getAllMockOrders()]);
    };
    window.addEventListener("aura-order-cancelled", handleOrderCancelled);
    return () => window.removeEventListener("aura-order-cancelled", handleOrderCancelled);
  }, []);

  // Initialize Speech Synthesis and Audio Amplitude Tracker
  useEffect(() => {
    const synth = new VoiceSynthesizer({
      onStart: () => {
        setAgentState("speaking");
        setTtsWarningMessage(null);
        // Ensure recognizer is paused while ARIA speaks
        recognizerRef.current?.pauseForTTS();
      },
      onEnd: () => {
        // Continuous Conversation: automatically return to Listening
        if (isCallActiveRef.current) {
          setAgentState("listening");
          recognizerRef.current?.resumeAfterTTS();
        } else {
          setAgentState("idle");
        }
      },
      onError: (err) => {
        console.warn("%c[STAGE: ERROR] TTS Playback Notice:", "color: #f59e0b;", err);
        setTtsWarningMessage(
          "I'm having trouble playing audio right now, but you can see my response below."
        );
        if (isCallActiveRef.current) {
          setAgentState("listening");
          recognizerRef.current?.resumeAfterTTS();
        } else {
          setAgentState("idle");
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
        console.log("[STAGE: TTS_CANCELLED_BY_USER_BARGE_IN]");
        synthesizerRef.current.cancel();
      }

      setAgentState("thinking");
      setLiveInterimTranscript("");

      const userMsg: Message = {
        role: "user",
        content: userText.trim(),
        timestamp: Date.now(),
      };

      console.log(`%c[STAGE: AI_REQUEST_STARTED] Query: "${userText.trim()}"`, "color: #3b82f6; font-weight: bold;");

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

      // 12s timeout controller ensures UI is never stuck indefinitely in "thinking"
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 12000);

      try {
        const currentCancelledIds = getCancelledOrderIds();
        const res = await fetch("/api/agent/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedHistory,
            cancelledOrderIds: currentCancelledIds,
          }),
          signal: abortController.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) throw new Error(`HTTP error ${res.status}`);

        const data: ChatResponse & {
          updatedOrders?: Order[];
          cancelledOrderIds?: string[];
        } = await res.json();
        const replyText = data.reply;

        console.log(`%c[STAGE: AI_RESPONSE_RECEIVED] Reply: "${replyText.slice(0, 70)}..."`, "color: #10b981; font-weight: bold;");

        if (data.updatedOrders && Array.isArray(data.updatedOrders)) {
          setOrders(data.updatedOrders);
        } else {
          setOrders([...getAllMockOrders()]);
        }

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
          recognizerRef.current?.pauseForTTS();
          synthesizerRef.current.speak(replyText);
        } else {
          setAgentState("idle");
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        console.error("%c[STAGE: ERROR] AI Request Failed:", "color: #ef4444; font-weight: bold;", err);

        const fallbackReply = "Sorry, I couldn't process that right now. Could you try again?";
        const fallbackMsg: Message = {
          role: "assistant",
          content: fallbackReply,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, fallbackMsg]);

        if (isCallActiveRef.current && synthesizerRef.current) {
          recognizerRef.current?.pauseForTTS();
          synthesizerRef.current.speak(fallbackReply);
        } else {
          setAgentState(isCallActiveRef.current ? "listening" : "idle");
          if (isCallActiveRef.current) {
            recognizerRef.current?.resumeAfterTTS();
          }
        }
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
          console.log("[STAGE: TTS_CANCELLED_BY_USER_BARGE_IN] User spoke while ARIA was speaking");
          synthesizerRef.current.cancel();
          setAgentState("listening");
        }
      },
      onResult: (transcript, isFinal) => {
        if (isFinal) {
          if (transcript.trim()) {
            setLiveInterimTranscript("");
            // Immediately pause recognizer while processing query and speaking reply
            recognizerRef.current?.pauseForTTS();
            handleSendMessage(transcript.trim(), true);
          }
        } else {
          setLiveInterimTranscript(transcript);
        }
      },
      onError: (err) => {
        console.warn("[STAGE: ERROR] Speech recognizer notice:", err);
      },
      onEnd: () => {
        if (isCallActiveRef.current && !synthesizerRef.current?.speaking) {
          rec.resumeAfterTTS();
        }
      },
    });

    recognizerRef.current = rec;
  }, [handleSendMessage]);

  // Start Real Browser Phone Call Flow
  const handleStartCall = async () => {
    console.log("%c[STAGE: CALL_STARTED] User initiated call", "color: #3b82f6; font-weight: bold;");
    setPermissionError(null);
    setTtsWarningMessage(null);
    setIsConnecting(true);

    try {
      // 1. Request microphone & initialize AudioContext
      const micRes = await audioTrackerRef.current?.start();
      if (!micRes?.success) {
        setIsConnecting(false);
        setAgentState("idle");
        setPermissionError(
          micRes?.message ||
            "Microphone access is needed to talk with ARIA. Please check browser microphone settings."
        );
        return;
      }

      console.log("%c[STAGE: MIC_STREAM_READY] AudioContext and Analyser connected", "color: #10b981; font-weight: bold;");

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

      // Pause recognizer before speaking greeting so mic does not pick it up
      recognizerRef.current?.pauseForTTS();
      setAgentState("speaking");

      if (synthesizerRef.current) {
        synthesizerRef.current.speak(greetingTurn.content);
      } else {
        setAgentState("listening");
        recognizerRef.current?.resumeAfterTTS();
      }
    } catch (err: any) {
      console.error("%c[STAGE: ERROR] Could not initialize call:", "color: #ef4444;", err);
      setIsConnecting(false);
      setAgentState("idle");
      setPermissionError("Could not access microphone: " + (err?.message || "Unknown error"));
    }
  };

  // End Call Handler
  const handleEndCall = () => {
    console.log("%c[STAGE: CALL_ENDED]", "color: #ef4444; font-weight: bold;");
    setIsCallActive(false);
    isCallActiveRef.current = false;
    setAgentState("ended");
    setLiveInterimTranscript("");

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
    setLiveInterimTranscript("");
    setTtsWarningMessage(null);

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

  // Diagnostic panel info
  const diagnosticInfo: DiagnosticInfo = {
    micStatus: audioTrackerRef.current?.isConnected
      ? "Connected (Real Stream)"
      : isCallActive
      ? "Connected"
      : "Disconnected",
    permissionStatus: permissionError
      ? "Denied / Error"
      : isCallActive
      ? "Granted"
      : "Not requested",
    sttStatus: recognizerRef.current?.active
      ? "Active (en-IN)"
      : recognizerRef.current?.pausedForTTS
      ? "Paused (Speaking)"
      : isCallActive
      ? "Ready"
      : "Idle",
    ttsStatus: synthesizerRef.current?.speaking
      ? "Speaking"
      : synthesizerRef.current
      ? `Available (${synthesizerRef.current.getSelectedVoiceName()})`
      : "Unavailable",
    aiStatus: agentState === "thinking" ? "Processing Query" : "Connected",
    currentState: agentState,
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
          interimTranscript={liveInterimTranscript}
          diagnosticInfo={diagnosticInfo}
          ttsWarningMessage={ttsWarningMessage}
          onCommitInterim={() => recognizerRef.current?.commitCurrentTranscript()}
          onSendMessage={(text) => handleSendMessage(text, true)}
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
        orders={orders}
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
