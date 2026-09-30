import { Message } from "@/lib/agent/chat-engine";
import { CallIntelligenceReport } from "@/lib/agent/call-summary";

export interface StoredConversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  report?: CallIntelligenceReport;
}

const STORAGE_KEY = "aura_aria_conversations_v1";

/**
 * Generate a concise, intelligent title from the first customer request
 */
export function generateConversationTitle(firstQuery: string): string {
  const lower = firstQuery.toLowerCase().trim();

  if (lower.includes("where") && (lower.includes("order") || lower.includes("package") || lower.includes("delivery"))) {
    return "Order delivery status";
  }
  if (lower.includes("cancel")) {
    return "Order cancellation";
  }
  if (lower.includes("sunscreen") && lower.includes("return")) {
    return "Sunscreen return";
  }
  if (lower.includes("return") || lower.includes("send back") || lower.includes("returned")) {
    return "Return policy & status";
  }
  if (lower.includes("damaged") || lower.includes("broken") || lower.includes("leak")) {
    return "Damaged item replacement";
  }
  if (lower.includes("refund") || lower.includes("money back")) {
    return "Refund inquiry";
  }
  if (lower.includes("product") || lower.includes("serum") || lower.includes("cream")) {
    return "Skincare product advice";
  }
  if (lower.includes("kaha") || lower.includes("batao") || lower.includes("mera order")) {
    return "Order tracking (Hinglish)";
  }
  if (lower.includes("flight") || lower.includes("pizza") || lower.includes("weather")) {
    return "General inquiry";
  }
  if (lower.includes("ord-") || lower.includes("order id")) {
    return "Order verification";
  }

  // Fallback: clean snippet of first 4 words
  const words = firstQuery.split(/\s+/).slice(0, 4).join(" ");
  return words.length > 28 ? words.slice(0, 25) + "…" : words || "Aura Skincare inquiry";
}

/**
 * Categorize timestamps into Today, Yesterday, or Older
 */
export function categorizeConversationDate(timestamp: number): "Today" | "Yesterday" | "Older" {
  const now = new Date();
  const date = new Date(timestamp);

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) return "Today";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return "Yesterday";

  return "Older";
}

/**
 * Load all stored conversations from localStorage
 */
export function loadStoredConversations(): StoredConversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Default initial mock history for first-time premium feel
      const sampleChats: StoredConversation[] = [
        {
          id: "chat-sample-1",
          title: "Order delivery status",
          createdAt: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
          updatedAt: Date.now() - 1000 * 60 * 60 * 2,
          messages: [
            { role: "user", content: "Where is my order ORD-101?", timestamp: Date.now() - 7200000 },
            {
              role: "assistant",
              content:
                "Your Vitamin C Serum (ORD-101) is currently out for delivery via BlueDart and expected by 6 PM today.",
              timestamp: Date.now() - 7195000,
            },
          ],
        },
        {
          id: "chat-sample-2",
          title: "Sunscreen return",
          createdAt: Date.now() - 1000 * 60 * 60 * 26, // Yesterday
          updatedAt: Date.now() - 1000 * 60 * 60 * 26,
          messages: [
            { role: "user", content: "Can I return my sunscreen ORD-102?", timestamp: Date.now() - 93600000 },
            {
              role: "assistant",
              content:
                "Order ORD-102 was delivered 14 days ago. Our return window is 7 days from delivery for unopened items, so this order is no longer eligible.",
              timestamp: Date.now() - 93595000,
            },
          ],
        },
        {
          id: "chat-sample-3",
          title: "Product routine advice",
          createdAt: Date.now() - 1000 * 60 * 60 * 72, // Older
          updatedAt: Date.now() - 1000 * 60 * 60 * 72,
          messages: [
            { role: "user", content: "What is best for dull morning skin?", timestamp: Date.now() - 259200000 },
            {
              role: "assistant",
              content:
                "For morning radiance, we recommend our Vitamin C 10% Serum followed immediately by our Hydrating SPF 50 Sunscreen.",
              timestamp: Date.now() - 259195000,
            },
          ],
        },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleChats));
      return sampleChats;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn("Failed to load stored conversations:", err);
    return [];
  }
}

/**
 * Save or update a conversation in localStorage
 */
export function saveStoredConversation(conv: StoredConversation): void {
  if (typeof window === "undefined") return;
  try {
    const list = loadStoredConversations();
    const existingIndex = list.findIndex((c) => c.id === conv.id);
    if (existingIndex >= 0) {
      list[existingIndex] = conv;
    } else {
      list.unshift(conv);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn("Failed to save conversation:", err);
  }
}

/**
 * Delete a stored conversation
 */
export function deleteStoredConversation(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const list = loadStoredConversations().filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn("Failed to delete conversation:", err);
  }
}
