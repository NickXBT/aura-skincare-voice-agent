import { getOrderById, normalizeOrderId, cancelOrderInDb, Order, OrderAuditEvent } from "@/lib/orders/database";

export interface ToolCallResult {
  tool: string;
  orderId: string;
  found: boolean;
  success?: boolean;
  new_status?: string;
  order?: Order;
  message: string;
  auditEvent?: OrderAuditEvent;
}

export const ORDER_TOOL_DEFINITION = {
  name: "get_order_details",
  description: "Lookup live order status, courier details, delivery timeline, address, contents, and cancellation eligibility for an Aura Skincare customer order using their Order ID (e.g., ORD-101).",
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

export const CANCEL_ORDER_TOOL_DEFINITION = {
  name: "cancel_order",
  description: "Cancel an active Aura Skincare customer order using their Order ID (e.g., ORD-103) ONLY AFTER the customer explicitly confirms cancellation. Only orders in 'Processing' status can be cancelled.",
  parameters: {
    type: "object",
    properties: {
      order_id: {
        type: "string",
        description: "The unique order identifier to cancel, e.g. 'ORD-103'.",
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
      success: false,
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
      success: false,
      message: `Order '${orderIdRaw.trim().toUpperCase()}' could not be located in our system. Please ask the customer to verify their order ID.`,
    };
  }

  let summary = `Order Found: ${order.id}. Customer: ${order.customerName}. Items: ${order.items.join(", ")} (${order.item_count} item${order.item_count > 1 ? "s" : ""}). Total: ${order.value} (${order.payment_method}, ${order.payment_status}). Shipping address: ${order.delivery_address}, ${order.city} - ${order.pincode}. Status: ${order.status}.`;
  
  if (order.status === "Out for Delivery") {
    summary += ` Courier: ${order.courier} (Tracking: ${order.trackingNumber}). Expected delivery: ${order.expectedDelivery}. Not eligible for cancellation because it is already out for delivery. Customer can refuse delivery at doorstep if no longer wanted.`;
  } else if (order.status === "Shipped") {
    summary += ` Courier: ${order.courier} (Tracking: ${order.trackingNumber}). Expected delivery: ${order.expectedDelivery}. Not eligible for cancellation because it has already shipped.`;
  } else if (order.status === "Delivered") {
    summary += ` Courier: ${order.courier} (Tracking: ${order.trackingNumber}). Delivered: ${order.deliveredAgo}. Return eligible: ${order.return_eligible ? "Yes (" + order.return_deadline + ")" : "No"}. Not eligible for cancellation.`;
  } else if (order.status === "Processing") {
    summary += ` Ordered: ${order.orderedAgo}. Cancellation: Eligible (order is currently being processed). If customer requests cancellation, verify and ask for confirmation before cancelling.`;
  } else if (order.status === "Cancelled") {
    summary += ` Order was cancelled. Payment status: ${order.payment_status}.`;
  }

  return {
    tool: "get_order_details",
    orderId: order.id,
    found: true,
    success: true,
    order,
    message: summary,
  };
}

/**
 * Executes cancel_order tool.
 */
export function executeCancelOrder(orderIdRaw: string): ToolCallResult {
  if (!orderIdRaw || !orderIdRaw.trim()) {
    return {
      tool: "cancel_order",
      orderId: "",
      found: false,
      success: false,
      message: "Error: Missing order ID. Please specify which order to cancel.",
    };
  }

  const normalized = normalizeOrderId(orderIdRaw);
  const result = cancelOrderInDb(normalized);

  return {
    tool: "cancel_order",
    orderId: normalized,
    found: !!result.order,
    success: result.success,
    new_status: result.new_status,
    order: result.order,
    message: result.message,
    auditEvent: result.auditEvent,
  };
}
