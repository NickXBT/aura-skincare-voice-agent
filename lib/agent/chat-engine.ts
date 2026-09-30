import { ARIA_SYSTEM_PROMPT } from "@/lib/agent/system-prompt";
import {
  executeGetOrderDetails,
  executeCancelOrder,
  ORDER_TOOL_DEFINITION,
  CANCEL_ORDER_TOOL_DEFINITION,
  ToolCallResult,
} from "@/lib/tools/order-tool";
import { normalizeOrderId, getOrderById } from "@/lib/orders/database";
import { executePipeline, PipelineResult } from "@/lib/agent/pipeline";
import { DetectedIntent } from "@/lib/agent/intent-classifier";
import { ExtractedEntities } from "@/lib/agent/entity-extractor";
import { ResolvedContext } from "@/lib/agent/context-manager";

export interface Message {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  toolCall?: {
    name: string;
    arguments: Record<string, any>;
    result?: ToolCallResult;
  };
  timestamp?: number;
}

export interface DebugPipelineInfo {
  detectedIntent: DetectedIntent;
  confidence: number;
  entities: ExtractedEntities;
  context: {
    activeOrderId: string | null;
    customerName: string | null;
    product: string | null;
  };
  orderRequired: "YES" | "NO";
  orderId: string | null;
  toolRequired: "YES" | "NO";
  policyRequired: "YES" | "NO";
  toolUsed: string | null;
  decision: string;
  policyDecision?: string;
  executionTimeMs: number;
}

export interface ChatResponse {
  reply: string;
  toolCallsExecuted: ToolCallResult[];
  detectedIntent: string;
  providerUsed: "gemini" | "groq" | "aura-intelligent-agent";
  debugInfo?: DebugPipelineInfo;
}

export interface ConversationMemory {
  activeOrderId: string | null;
  activeProduct: string | null;
  activeCustomerName: string | null;
  lastIntent: string | null;
  awaitingOrderIdFor: "tracking" | "cancellation" | "return" | null;
  isHinglish: boolean;
  historyLength: number;
}

export function extractConversationMemory(messages: Message[]): ConversationMemory {
  let activeOrderId: string | null = null;
  let activeProduct: string | null = null;
  let activeCustomerName: string | null = null;
  let lastIntent: string | null = null;
  let awaitingOrderIdFor: "tracking" | "cancellation" | "return" | null = null;
  let isHinglish = false;

  const hinglishTokens = /\b(kahan|kaha|kab|kya|hai|haan|ji|bhai|mera|meri|nahi|nahin|aaya|aayega|kar do|kardo|karo|batao|shukriya|dhanyawaad)\b/i;

  for (const m of messages) {
    if (m.role === "user" && hinglishTokens.test(m.content)) {
      isHinglish = true;
    }

    const idMatch = m.content.match(/(?:ORD[- ]?)?(\d{3})/i);
    if (idMatch && idMatch[1]) {
      const candidateId = `ORD-${idMatch[1]}`;
      const found = getOrderById(candidateId);
      if (found) {
        activeOrderId = found.id;
        activeProduct = found.product;
        activeCustomerName = found.customerName;
      } else {
        activeOrderId = candidateId;
      }
    }

    if (m.content.match(/vitamin c serum/i) || (m.content.match(/serum/i) && !m.content.match(/niacinamide/i))) {
      activeProduct = "Vitamin C Serum (30ml)";
      if (!activeOrderId) activeOrderId = "ORD-101";
    } else if (m.content.match(/sunscreen/i) && !m.content.match(/stick/i)) {
      activeProduct = "Hydrating Sunscreen SPF 50";
      if (!activeOrderId) activeOrderId = "ORD-102";
    } else if (m.content.match(/green tea|face wash|toner/i)) {
      activeProduct = "Green Tea Face Wash + Toner";
      if (!activeOrderId) activeOrderId = "ORD-103";
    } else if (m.content.match(/niacinamide/i)) {
      activeProduct = "Niacinamide Serum + Night Cream";
      if (!activeOrderId) activeOrderId = "ORD-104";
    } else if (m.content.match(/rose water/i)) {
      activeProduct = "Rose Water Mist + Cleansing Balm";
      if (!activeOrderId) activeOrderId = "ORD-105";
    } else if (m.content.match(/ceramide/i)) {
      activeProduct = "Ceramide Barrier Repair Cream";
      if (!activeOrderId) activeOrderId = "ORD-106";
    } else if (m.content.match(/face scrub/i)) {
      activeProduct = "Vitamin C Brightening Face Scrub";
      if (!activeOrderId) activeOrderId = "ORD-107";
    } else if (m.content.match(/salicylic/i)) {
      activeProduct = "Salicylic Acid 2% Toner";
      if (!activeOrderId) activeOrderId = "ORD-108";
    } else if (m.content.match(/eye gel/i)) {
      activeProduct = "Peptide Eye Gel + Sunscreen Stick";
      if (!activeOrderId) activeOrderId = "ORD-109";
    } else if (m.content.match(/kumkumadi/i)) {
      activeProduct = "Kumkumadi Glow Facial Oil";
      if (!activeOrderId) activeOrderId = "ORD-110";
    }
  }

  return {
    activeOrderId,
    activeProduct,
    activeCustomerName,
    lastIntent,
    awaitingOrderIdFor,
    isHinglish,
    historyLength: messages.length,
  };
}

export function processIntelligentTurn(messages: Message[]): ChatResponse {
  const result: PipelineResult = executePipeline(messages);

  return {
    reply: result.reply,
    toolCallsExecuted: result.toolCallsExecuted,
    detectedIntent: result.detectedIntent,
    providerUsed: "aura-intelligent-agent",
    debugInfo: {
      detectedIntent: result.detectedIntent,
      confidence: result.confidence,
      entities: result.entities,
      context: {
        activeOrderId: result.context.activeOrderId,
        customerName: result.context.customerName,
        product: result.context.product,
      },
      orderRequired: result.orderRequired,
      orderId: result.orderId,
      toolRequired: result.toolRequired,
      policyRequired: result.policyRequired,
      toolUsed: result.toolUsed,
      decision: result.decision,
      policyDecision: result.policyDecision,
      executionTimeMs: result.executionTimeMs,
    },
  };
}

export async function getAgentReply(messages: Message[], apiKeyOverride?: string): Promise<ChatResponse> {
  const geminiKey = apiKeyOverride || process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  if (geminiKey) {
    try {
      const response = await callGeminiWithTools(messages, geminiKey);
      if (response) return response;
    } catch (err) {
      console.warn("Gemini call fell back to intelligent reasoning pipeline:", err);
    }
  } else if (groqKey) {
    try {
      const response = await callGroqWithTools(messages, groqKey);
      if (response) return response;
    } catch (err) {
      console.warn("Groq call fell back to intelligent reasoning pipeline:", err);
    }
  }

  return processIntelligentTurn(messages);
}

/**
 * Gemini 1.5 Flash tool calling implementation
 */
async function callGeminiWithTools(messages: Message[], apiKey: string): Promise<ChatResponse | null> {
  const memory = extractConversationMemory(messages);
  const contextNotes = `ACTIVE CONVERSATIONAL CONTEXT:
- Known Order ID in discussion: ${memory.activeOrderId || "None yet"}
- Product in discussion: ${memory.activeProduct || "None yet"}
- User Language: ${memory.isHinglish ? "Hinglish / Hindi-English mix" : "English"}`;

  const contents = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const payload = {
    system_instruction: {
      parts: [{ text: `${ARIA_SYSTEM_PROMPT}\n\n${contextNotes}` }],
    },
    contents,
    tools: [
      {
        function_declarations: [ORDER_TOOL_DEFINITION, CANCEL_ORDER_TOOL_DEFINITION],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 200,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`Gemini error: ${res.statusText}`);

  const data = await res.json();
  const candidate = data.candidates?.[0]?.content?.parts?.[0];
  const toolCallsExecuted: ToolCallResult[] = [];

  if (candidate?.functionCall) {
    const fn = candidate.functionCall;
    if (fn.name === "get_order_details") {
      const orderId = fn.args?.order_id || memory.activeOrderId || "";
      const toolRes = executeGetOrderDetails(orderId);
      toolCallsExecuted.push(toolRes);

      const followUpContents = [
        ...contents,
        { role: "model", parts: [{ functionCall: fn }] },
        {
          role: "user",
          parts: [
            {
              functionResponse: {
                name: "get_order_details",
                response: { output: toolRes.message },
              },
            },
          ],
        },
      ];

      const followUpRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: ARIA_SYSTEM_PROMPT }] },
          contents: followUpContents,
          generationConfig: { temperature: 0.3, maxOutputTokens: 200 },
        }),
      });

      if (followUpRes.ok) {
        const followUpData = await followUpRes.json();
        const text = followUpData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return {
            reply: text.trim(),
            toolCallsExecuted,
            detectedIntent: "ORDER_TRACKING",
            providerUsed: "gemini",
          };
        }
      }
    } else if (fn.name === "cancel_order") {
      const orderId = fn.args?.order_id || memory.activeOrderId || "";
      const toolRes = executeCancelOrder(orderId);
      toolCallsExecuted.push(toolRes);

      const followUpContents = [
        ...contents,
        { role: "model", parts: [{ functionCall: fn }] },
        {
          role: "user",
          parts: [
            {
              functionResponse: {
                name: "cancel_order",
                response: { output: toolRes.message },
              },
            },
          ],
        },
      ];

      const followUpRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: ARIA_SYSTEM_PROMPT }] },
          contents: followUpContents,
          generationConfig: { temperature: 0.3, maxOutputTokens: 200 },
        }),
      });

      if (followUpRes.ok) {
        const followUpData = await followUpRes.json();
        const text = followUpData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return {
            reply: text.trim(),
            toolCallsExecuted,
            detectedIntent: "CANCELLATION",
            providerUsed: "gemini",
          };
        }
      }
    }
  }

  if (candidate?.text) {
    return {
      reply: candidate.text.trim(),
      toolCallsExecuted,
      detectedIntent: "GENERAL_SUPPORT",
      providerUsed: "gemini",
    };
  }

  return null;
}

/**
 * Groq tool-enabled chat
 */
async function callGroqWithTools(messages: Message[], apiKey: string): Promise<ChatResponse | null> {
  const groqMessages = [
    { role: "system", content: ARIA_SYSTEM_PROMPT },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: groqMessages,
      temperature: 0.3,
      max_tokens: 200,
    }),
  });

  if (!res.ok) throw new Error(`Groq error: ${res.statusText}`);

  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content;
  if (reply) {
    return {
      reply: reply.trim(),
      toolCallsExecuted: [],
      detectedIntent: "GENERAL_SUPPORT",
      providerUsed: "groq",
    };
  }

  return null;
}
