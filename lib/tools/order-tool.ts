import { getOrderById, normalizeOrderId, Order } from "@/lib/orders/database";

export interface ToolCallResult {
  tool: string;
  orderId: string;
  found: boolean;
  order?: Order;
  message: string;
}

export const ORDER_TOOL_DEFINITION = {
  name: "get_order_details",
  description: "Lookup live order status, courier details, delivery timeline, and cancellation eligibility for an Aura Skincare customer order using their Order ID (e.g., ORD-101).",
  parameters: {
    type: "object",
    properties: {
      order_id: {
        type: "string",
        description: "The unique order identifier, such as 'ORD-101', 'ORD-102', or 'ORD-103'.",
      },
    },
    required: ["order_id"],
  },
};

/**
 * Executes get_order_details tool.
 */
export function executeGetOrderDetails(orderIdRaw: string): ToolCallResult {
  if (!orderIdRaw || !orderIdRaw.trim()) {
    return {
      tool: "get_order_details",
      orderId: "",
      found: false,
      message: "Error: Missing order ID. Please ask the customer to provide their specific order ID (e.g., ORD-101).",
    };
  }

  const normalized = normalizeOrderId(orderIdRaw);
  const order = getOrderById(normalized);

  if (!order) {
    return {
      tool: "get_order_details",
      orderId: normalized || orderIdRaw,
      found: false,
      message: `Order '${orderIdRaw.trim().toUpperCase()}' could not be located in our system. Please ask the customer to verify their order ID.`,
    };
  }

  let summary = `Order Found: ${order.id}. Customer: ${order.customerName}. Product: ${order.product}. Amount: ${order.value}. Status: ${order.status}.`;
  
  if (order.status === "Out for Delivery") {
    summary += ` Courier: ${order.courier} (Tracking: ${order.trackingNumber}). Expected delivery: ${order.expectedDelivery}. Not eligible for cancellation because it is already out for delivery. Customer can refuse delivery at doorstep if no longer wanted.`;
  } else if (order.status === "Delivered") {
    summary += ` Courier: ${order.courier} (Tracking: ${order.trackingNumber}). Delivered: ${order.deliveredAgo}. Not eligible for cancellation. Return window is within 7 days of delivery for unopened items in original packaging.`;
  } else if (order.status === "Processing") {
    summary += ` Ordered: ${order.orderedAgo}. Cancellation: Eligible (order is still processing).`;
  }

  return {
    tool: "get_order_details",
    orderId: order.id,
    found: true,
    order,
    message: summary,
  };
}
