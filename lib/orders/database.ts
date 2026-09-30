export interface Order {
  id: string;
  customerName: string;
  product: string;
  value: string;
  amount: number;
  status: "Out for Delivery" | "Delivered" | "Processing" | "Shipped" | "Cancelled";
  courier?: string;
  trackingNumber?: string;
  expectedDelivery?: string;
  deliveredAgo?: string;
  orderedAgo?: string;
  cancellationEligible?: boolean;
}

export const MOCK_ORDERS: Record<string, Order> = {
  "ORD-101": {
    id: "ORD-101",
    customerName: "Priya Sharma",
    product: "Vitamin C Serum (30ml)",
    value: "₹699",
    amount: 699,
    status: "Out for Delivery",
    courier: "BlueDart",
    trackingNumber: "BD-982103",
    expectedDelivery: "6 PM today",
    cancellationEligible: false,
  },
  "ORD-102": {
    id: "ORD-102",
    customerName: "Rahul Verma",
    product: "Hydrating Sunscreen SPF 50",
    value: "₹499",
    amount: 499,
    status: "Delivered",
    courier: "Delhivery",
    trackingNumber: "DL-441029",
    deliveredAgo: "14 days ago",
    cancellationEligible: false,
  },
  "ORD-103": {
    id: "ORD-103",
    customerName: "Ananya Patel",
    product: "Green Tea Face Wash + Toner",
    value: "₹850",
    amount: 850,
    status: "Processing",
    orderedAgo: "3 hours ago",
    cancellationEligible: true,
  },
};

/**
 * Normalized order ID search (e.g. ord 101, ord-101, ORD101 -> ORD-101)
 */
export function normalizeOrderId(rawId: string): string {
  if (!rawId) return "";
  const cleaned = rawId.toUpperCase().replace(/\s+/g, "").replace(/[^A-Z0-9-]/g, "");
  
  // Match patterns like ORD101, ORD-101, 101
  const match = cleaned.match(/(?:ORD-?|ORDER-?)?(\d{3})/i);
  if (match && match[1]) {
    return `ORD-${match[1]}`;
  }
  return cleaned;
}

/**
 * Retrieves order details by order_id.
 */
export function getOrderById(orderId: string): Order | null {
  const normalized = normalizeOrderId(orderId);
  return MOCK_ORDERS[normalized] || null;
}

export function getAllMockOrders(): Order[] {
  return Object.values(MOCK_ORDERS);
}
