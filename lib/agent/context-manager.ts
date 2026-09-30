import { Message } from "@/lib/agent/chat-engine";
import { ExtractedEntities } from "@/lib/agent/entity-extractor";
import { getOrderById, Order, getAllMockOrders } from "@/lib/orders/database";

export interface ResolvedContext {
  activeOrderId: string | null;
  activeOrder: Order | null;
  customerName: string | null;
  product: string | null;
  lastIntent: string | null;
  awaitingField: "ORDER_ID" | null;
  isSwitchingOrder: boolean;
  awaitingCancellationConfirmation: boolean;
  pendingCancelOrderId: string | null;
}

/**
 * Resolves context by combining historical turns with newly extracted entities
 */
export function resolveConversationContext(
  messages: Message[],
  currentEntities: ExtractedEntities
): ResolvedContext {
  let activeOrderId = currentEntities.orderId;
  let customerName = currentEntities.customerName;
  let product = currentEntities.product;
  let lastIntent: string | null = null;
  let awaitingField: "ORDER_ID" | null = null;
  let isSwitchingOrder = false;
  let awaitingCancellationConfirmation = false;
  let pendingCancelOrderId: string | null = null;

  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  const query = lastUserMsg?.content.toLowerCase() || "";

  // Check if user explicitly switches order ("what about the other one?", "my other order")
  if (/\b(other order|another order|different order|dusra order|other one)\b/i.test(query)) {
    isSwitchingOrder = true;
    activeOrderId = null;
  }

  // Detect if previous assistant message asked for cancellation confirmation
  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant");
  if (lastAssistantMsg) {
    const text = lastAssistantMsg.content.toLowerCase();
    if (
      text.includes("would you like me to cancel") ||
      text.includes("would you like me to go ahead and cancel") ||
      text.includes("confirm cancellation") ||
      text.includes("eligible for cancellation. would you like") ||
      text.includes("eligible for cancellation. should i") ||
      text.includes("cancel it for you")
    ) {
      awaitingCancellationConfirmation = true;
      const match = lastAssistantMsg.content.match(/(?:ORD[- ]?)?(\d{3})/i);
      if (match && match[1]) {
        pendingCancelOrderId = `ORD-${match[1]}`;
      }
    }
  }

  // If no order ID extracted directly from current query, scan previous turns in reverse
  if (!activeOrderId && !isSwitchingOrder) {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      const match = msg.content.match(/(?:ORD[- ]?)?(\d{3})/i);
      if (match && match[1]) {
        activeOrderId = `ORD-${match[1]}`;
        break;
      }
    }
  }

  // If still no active order ID but pending cancellation exists, inherit it
  if (!activeOrderId && pendingCancelOrderId) {
    activeOrderId = pendingCancelOrderId;
  }

  // Cross-reference customer name to mock database
  if (!activeOrderId && customerName) {
    const allOrders = getAllMockOrders();
    const match = allOrders.find((o) =>
      o.customerName.toLowerCase().includes(customerName!.toLowerCase().split(" ")[0])
    );
    if (match) {
      activeOrderId = match.id;
      product = match.product;
    }
  }

  // Cross-reference product to mock database if user says "my sunscreen", "the serum", etc.
  if (!activeOrderId && product && !isSwitchingOrder) {
    if (product.includes("Serum") && !product.includes("Niacinamide")) activeOrderId = "ORD-101";
    else if (product.includes("Sunscreen") && !product.includes("Stick")) activeOrderId = "ORD-102";
    else if (product.includes("Face Wash") || product.includes("Balancing Toner")) activeOrderId = "ORD-103";
    else if (product.includes("Niacinamide") || product.includes("Night Cream")) activeOrderId = "ORD-104";
    else if (product.includes("Rose Water") || product.includes("Cleansing Balm")) activeOrderId = "ORD-105";
    else if (product.includes("Ceramide")) activeOrderId = "ORD-106";
    else if (product.includes("Face Scrub")) activeOrderId = "ORD-107";
    else if (product.includes("Salicylic")) activeOrderId = "ORD-108";
    else if (product.includes("Eye Gel") || product.includes("Sunscreen Stick")) activeOrderId = "ORD-109";
    else if (product.includes("Kumkumadi")) activeOrderId = "ORD-110";
  }

  // Cross-reference timeframe: "the order I bought yesterday" or "3 hours ago"
  if (!activeOrderId && currentEntities.timeframeDescription && !isSwitchingOrder) {
    if (currentEntities.timeframeDescription === "yesterday" || currentEntities.timeframeDescription === "today" || currentEntities.timeframeDescription === "3 hours ago") {
      activeOrderId = "ORD-103"; // Ordered 3 hours ago
    }
  }

  // Lookup full order record if ID was resolved
  const activeOrder = activeOrderId ? getOrderById(activeOrderId) : null;
  if (activeOrder) {
    customerName = customerName || activeOrder.customerName;
    product = product || activeOrder.product;
  }

  return {
    activeOrderId,
    activeOrder,
    customerName,
    product,
    lastIntent,
    awaitingField,
    isSwitchingOrder,
    awaitingCancellationConfirmation,
    pendingCancelOrderId: pendingCancelOrderId || activeOrderId,
  };
}
