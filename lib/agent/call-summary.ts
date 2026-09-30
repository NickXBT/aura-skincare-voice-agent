import { Message } from "@/lib/agent/chat-engine";
import { ToolCallResult } from "@/lib/tools/order-tool";

export type CustomerIntent =
  | "ORDER_TRACKING"
  | "ORDER_CANCELLATION"
  | "RETURN_REQUEST"
  | "REFUND_REQUEST"
  | "SHIPPING_INFORMATION"
  | "COD_INFORMATION"
  | "PRODUCT_INFORMATION"
  | "GENERAL_SUPPORT"
  | "OUT_OF_SCOPE";

export type ResolutionStatus =
  | "RESOLVED"
  | "PARTIALLY_RESOLVED"
  | "UNRESOLVED"
  | "OUT_OF_SCOPE";

export type CustomerSentiment = "Calm" | "Frustrated" | "Neutral" | "Positive";

export interface StructuredCallOutcome {
  customer_intent: CustomerIntent;
  order_id: string | null;
  resolution_status: ResolutionStatus;
  call_summary: string;
  key_topics: string[];
  actions_taken: string[];
  follow_up_required: boolean;
}

export interface AgentQualityMetrics {
  totalTurns: number;
  toolCallsCount: number;
  issueResolved: boolean;
  unsupportedRequestCorrectlyRejected: boolean;
  agentNeededClarification: boolean;
  averageLatencyMs?: number;
}

export interface CallIntelligenceReport {
  outcome: StructuredCallOutcome;
  sentiment: CustomerSentiment;
  agentQuality: AgentQualityMetrics;
  generatedAt: string;
}

/**
 * Generates structured post-call summary and intelligence analytics
 * from the conversation messages and tool execution history.
 */
export function generateCallSummary(
  messages: Message[],
  toolCalls: ToolCallResult[] = []
): CallIntelligenceReport {
  const userMessages = messages.filter((m) => m.role === "user");
  const assistantMessages = messages.filter((m) => m.role === "assistant");
  const fullConversationText = messages.map((m) => `${m.role}: ${m.content}`).join("\n");
  const lowerFull = fullConversationText.toLowerCase();

  // 1. Identify Order ID
  let orderId: string | null = null;
  for (const tc of toolCalls) {
    if (tc.orderId) {
      orderId = tc.orderId;
      break;
    }
  }
  if (!orderId) {
    const orderMatch = lowerFull.match(/(?:ord(?:er)?[- ]?)?(\d{3})/i);
    if (orderMatch) {
      orderId = `ORD-${orderMatch[1]}`;
    }
  }

  // 2. Identify Intent
  let intent: CustomerIntent = "GENERAL_SUPPORT";
  const keyTopics: string[] = [];
  const actionsTaken: string[] = [];

  if (
    lowerFull.includes("flight") ||
    lowerFull.includes("hotel") ||
    lowerFull.includes("weather") ||
    lowerFull.includes("homework") ||
    lowerFull.includes("politics")
  ) {
    intent = "OUT_OF_SCOPE";
    keyTopics.push("Out of scope request", "Boundary enforcement");
    actionsTaken.push("Politely redirected customer back to Aura Skincare scope");
  } else if (lowerFull.includes("cancel")) {
    intent = "ORDER_CANCELLATION";
    keyTopics.push("Order cancellation", "Cancellation policy check");
    if (toolCalls.length > 0) {
      actionsTaken.push(`Queried order details for ${orderId || "order"}`);
      const isOutForDelivery = toolCalls.some(t => t.order?.status === "Out for Delivery");
      if (isOutForDelivery) {
        actionsTaken.push("Informed customer of non-cancellable state and advised delivery refusal");
      } else {
        actionsTaken.push("Validated processing state and initiated cancellation");
      }
    }
  } else if (lowerFull.includes("track") || lowerFull.includes("where is") || lowerFull.includes("status")) {
    intent = "ORDER_TRACKING";
    keyTopics.push("Live order tracking", "Courier and ETA details");
    if (toolCalls.length > 0) {
      actionsTaken.push(`Retrieved real-time tracking for ${orderId || "order"}`);
    }
  } else if (lowerFull.includes("return") || lowerFull.includes("exchange")) {
    intent = "RETURN_REQUEST";
    keyTopics.push("Return eligibility", "7-day unopened policy");
    if (lowerFull.includes("opened") || lowerFull.includes("20 days") || lowerFull.includes("14 days")) {
      actionsTaken.push("Explained 7-day unopened return policy constraint");
    } else {
      actionsTaken.push("Outlined standard return guidelines and packaging requirements");
    }
  } else if (lowerFull.includes("refund")) {
    intent = "REFUND_REQUEST";
    keyTopics.push("Refund policy", "Bank/UPI timeline");
    actionsTaken.push("Explained refund process and criteria");
  } else if (lowerFull.includes("shipping") || lowerFull.includes("delivery fee")) {
    intent = "SHIPPING_INFORMATION";
    keyTopics.push("Shipping threshold (₹499)", "Delivery timeframes (3-5 days)");
    actionsTaken.push("Provided shipping cost structure and delivery timeline");
  } else if (lowerFull.includes("cod") || lowerFull.includes("cash on delivery")) {
    intent = "COD_INFORMATION";
    keyTopics.push("Cash on Delivery limits (₹2,500)", "Doorstep Cash & UPI payment");
    actionsTaken.push("Confirmed COD availability and doorstep payment options");
  } else if (lowerFull.includes("product") || lowerFull.includes("serum") || lowerFull.includes("sunscreen") || lowerFull.includes("organic")) {
    intent = "PRODUCT_INFORMATION";
    keyTopics.push("Product inquiry", "Organic ingredient formulations");
    actionsTaken.push("Provided product recommendations and ingredient details");
  }

  // 3. Sentiment Analysis (Observable conversational signals)
  let sentiment: CustomerSentiment = "Neutral";
  const frustratedKeywords = ["angry", "frustrated", "terrible", "worst", "ridiculous", "scam", "waste of money", "annoying", "hate", "upset"];
  const positiveKeywords = ["thank you", "thanks", "great", "awesome", "perfect", "appreciate", "helpful", "good", "wonderful"];

  if (frustratedKeywords.some((w) => lowerFull.includes(w))) {
    sentiment = "Frustrated";
  } else if (positiveKeywords.some((w) => lowerFull.includes(w))) {
    sentiment = "Positive";
  } else if (userMessages.length > 0) {
    sentiment = "Calm";
  }

  // 4. Resolution Status
  let resolutionStatus: ResolutionStatus = "RESOLVED";
  let followUpRequired = false;

  if (intent === "OUT_OF_SCOPE") {
    resolutionStatus = "OUT_OF_SCOPE";
  } else if (lowerFull.includes("could not be located") || lowerFull.includes("verify your order id")) {
    resolutionStatus = "PARTIALLY_RESOLVED";
    followUpRequired = true;
    actionsTaken.push("Requested valid order ID verification from customer");
  } else if (lowerFull.includes("human") || lowerFull.includes("escalate")) {
    resolutionStatus = "PARTIALLY_RESOLVED";
    followUpRequired = true;
    actionsTaken.push("Flagged for human support team escalation");
  } else if (userMessages.length === 0) {
    resolutionStatus = "UNRESOLVED";
  }

  // 5. Short AI Summary
  let summaryText = "";
  if (intent === "OUT_OF_SCOPE") {
    summaryText = `Customer inquired regarding an out-of-scope non-skincare topic. Aria upheld brand guardrails and politely redirected the customer.`;
  } else if (intent === "ORDER_TRACKING") {
    summaryText = `Customer requested live status for ${orderId || "their order"}. Aria executed the order lookup tool and provided courier, tracking code, and expected delivery status.`;
  } else if (intent === "ORDER_CANCELLATION") {
    summaryText = `Customer requested cancellation for ${orderId || "an order"}. Order status was verified; policies for processing or out-for-delivery states were clearly communicated.`;
  } else if (intent === "RETURN_REQUEST") {
    summaryText = `Customer asked regarding return eligibility. Aria explained the 7-day unopened product policy and assisted with standard procedures.`;
  } else if (intent === "SHIPPING_INFORMATION" || intent === "COD_INFORMATION") {
    summaryText = `Customer asked about delivery and payment options. Aria explained the ₹499 free delivery threshold and COD limits up to ₹2,500.`;
  } else {
    summaryText = `Customer spoke with customer support specialist Aria regarding Aura Skincare inquiries. Core questions were addressed concisely.`;
  }

  // 6. Agent Quality Metrics
  const totalTurns = userMessages.length + assistantMessages.length;
  const toolCallsCount = toolCalls.length;
  const unsupportedRequestCorrectlyRejected =
    intent === "OUT_OF_SCOPE" ||
    lowerFull.includes("cannot be cancelled") ||
    lowerFull.includes("not eligible for a return");
  const agentNeededClarification =
    lowerFull.includes("could you please provide your order id") ||
    lowerFull.includes("verify your order id");

  return {
    outcome: {
      customer_intent: intent,
      order_id: orderId,
      resolution_status: resolutionStatus,
      call_summary: summaryText,
      key_topics: keyTopics.length > 0 ? keyTopics : ["Customer Support Inquiry"],
      actions_taken: actionsTaken.length > 0 ? actionsTaken : ["Provided customer service response"],
      follow_up_required: followUpRequired,
    },
    sentiment,
    agentQuality: {
      totalTurns,
      toolCallsCount,
      issueResolved: resolutionStatus === "RESOLVED",
      unsupportedRequestCorrectlyRejected,
      agentNeededClarification,
    },
    generatedAt: new Date().toISOString(),
  };
}
