export interface Order {
  id: string;
  order_id: string;
  customer_name: string;
  customerName: string;
  phone_last4: string;
  email: string;
  items: string[];
  product: string;
  item_count: number;
  subtotal: number;
  shipping_fee: number;
  total_amount: number;
  value: string;
  amount: number;
  payment_method: "Credit Card" | "Debit Card" | "UPI" | "Cash on Delivery" | "Net Banking";
  payment_status: "Paid" | "Pending" | "Refunded";
  order_status: "Processing" | "Confirmed" | "Shipped" | "Out for Delivery" | "Delivered" | "Cancelled";
  status: "Processing" | "Confirmed" | "Shipped" | "Out for Delivery" | "Delivered" | "Cancelled";
  order_date: string;
  orderedAgo?: string;
  expected_delivery?: string;
  expectedDelivery?: string;
  deliveredAgo?: string;
  delivery_address: string;
  city: string;
  pincode: string;
  courier?: string;
  tracking_id?: string;
  trackingNumber?: string;
  cancellation_eligible: boolean;
  cancellationEligible: boolean;
  return_eligible: boolean;
  return_deadline?: string;
  delivery_attempts?: number;
  notes?: string;
}

const INITIAL_MOCK_ORDERS: Record<string, Order> = {
  "ORD-101": {
    id: "ORD-101",
    order_id: "ORD-101",
    customer_name: "Priya Sharma",
    customerName: "Priya Sharma",
    phone_last4: "9821",
    email: "priya.sharma@example.com",
    items: ["Vitamin C Serum (30ml)"],
    product: "Vitamin C Serum (30ml)",
    item_count: 1,
    subtotal: 699,
    shipping_fee: 0,
    total_amount: 699,
    value: "₹699",
    amount: 699,
    payment_method: "UPI",
    payment_status: "Paid",
    order_status: "Out for Delivery",
    status: "Out for Delivery",
    order_date: "2026-09-28",
    expected_delivery: "6 PM today",
    expectedDelivery: "6 PM today",
    delivery_address: "Flat 402, Lotus Residency, Indiranagar",
    city: "Bengaluru",
    pincode: "560038",
    courier: "BlueDart",
    tracking_id: "BD-982103",
    trackingNumber: "BD-982103",
    cancellation_eligible: false,
    cancellationEligible: false,
    return_eligible: false,
    notes: "Courier out for delivery. Refusal at doorstep permitted if not wanted.",
  },
  "ORD-102": {
    id: "ORD-102",
    order_id: "ORD-102",
    customer_name: "Rahul Verma",
    customerName: "Rahul Verma",
    phone_last4: "4410",
    email: "rahul.v@example.com",
    items: ["Hydrating Sunscreen SPF 50"],
    product: "Hydrating Sunscreen SPF 50",
    item_count: 1,
    subtotal: 449,
    shipping_fee: 50,
    total_amount: 499,
    value: "₹499",
    amount: 499,
    payment_method: "Credit Card",
    payment_status: "Paid",
    order_status: "Delivered",
    status: "Delivered",
    order_date: "2026-09-16",
    deliveredAgo: "14 days ago",
    delivery_address: "12-B, Green Avenue, Sector 15",
    city: "Gurugram",
    pincode: "122001",
    courier: "Delhivery",
    tracking_id: "DL-441029",
    trackingNumber: "DL-441029",
    cancellation_eligible: false,
    cancellationEligible: false,
    return_eligible: false,
    notes: "Delivered 14 days ago. Exceeds Aura's 7-day return window.",
  },
  "ORD-103": {
    id: "ORD-103",
    order_id: "ORD-103",
    customer_name: "Ananya Patel",
    customerName: "Ananya Patel",
    phone_last4: "8820",
    email: "ananya.patel@example.com",
    items: ["Green Tea Face Wash", "Balancing Toner"],
    product: "Green Tea Face Wash + Toner",
    item_count: 2,
    subtotal: 850,
    shipping_fee: 0,
    total_amount: 850,
    value: "₹850",
    amount: 850,
    payment_method: "Net Banking",
    payment_status: "Paid",
    order_status: "Processing",
    status: "Processing",
    order_date: "2026-09-30",
    orderedAgo: "3 hours ago",
    expected_delivery: "In 3 to 4 business days",
    expectedDelivery: "In 3 to 4 business days",
    delivery_address: "74, Marine Lines, Churchgate",
    city: "Mumbai",
    pincode: "400020",
    cancellation_eligible: true,
    cancellationEligible: true,
    return_eligible: false,
    notes: "Processing at central warehouse. Eligible for cancellation.",
  },
  "ORD-104": {
    id: "ORD-104",
    order_id: "ORD-104",
    customer_name: "Vikram Singhania",
    customerName: "Vikram Singhania",
    phone_last4: "1928",
    email: "vikram.s@example.com",
    items: ["Niacinamide 10% Clarifying Serum", "Deep Hydration Night Cream"],
    product: "Niacinamide Serum + Night Cream",
    item_count: 2,
    subtotal: 1199,
    shipping_fee: 0,
    total_amount: 1199,
    value: "₹1,199",
    amount: 1199,
    payment_method: "UPI",
    payment_status: "Paid",
    order_status: "Processing",
    status: "Processing",
    order_date: "2026-09-30",
    orderedAgo: "1 hour ago",
    expected_delivery: "In 3 to 5 business days",
    expectedDelivery: "In 3 to 5 business days",
    delivery_address: "Villa 8, Palm Meadows, Whitefield",
    city: "Bengaluru",
    pincode: "560066",
    cancellation_eligible: true,
    cancellationEligible: true,
    return_eligible: false,
    notes: "Just placed. Eligible for cancellation.",
  },
  "ORD-105": {
    id: "ORD-105",
    order_id: "ORD-105",
    customer_name: "Sneha Kapoor",
    customerName: "Sneha Kapoor",
    phone_last4: "7731",
    email: "sneha.k@example.com",
    items: ["Rose Water Hydrosol Mist", "Gentle Cleansing Balm"],
    product: "Rose Water Mist + Cleansing Balm",
    item_count: 2,
    subtotal: 750,
    shipping_fee: 0,
    total_amount: 750,
    value: "₹750",
    amount: 750,
    payment_method: "Debit Card",
    payment_status: "Paid",
    order_status: "Shipped",
    status: "Shipped",
    order_date: "2026-09-29",
    expected_delivery: "Tomorrow by 2 PM",
    expectedDelivery: "Tomorrow by 2 PM",
    delivery_address: "C-14, Vasant Vihar",
    city: "New Delhi",
    pincode: "110057",
    courier: "DTDC",
    tracking_id: "DT-882910",
    trackingNumber: "DT-882910",
    cancellation_eligible: false,
    cancellationEligible: false,
    return_eligible: false,
    notes: "Dispatched from Delhi hub. Cannot be cancelled once shipped.",
  },
  "ORD-106": {
    id: "ORD-106",
    order_id: "ORD-106",
    customer_name: "Rohan Gupta",
    customerName: "Rohan Gupta",
    phone_last4: "3145",
    email: "rohan.gupta@example.com",
    items: ["Ceramide Barrier Repair Cream"],
    product: "Ceramide Barrier Repair Cream",
    item_count: 1,
    subtotal: 599,
    shipping_fee: 0,
    total_amount: 599,
    value: "₹599",
    amount: 599,
    payment_method: "Cash on Delivery",
    payment_status: "Pending",
    order_status: "Processing",
    status: "Processing",
    order_date: "2026-09-30",
    orderedAgo: "4 hours ago",
    expected_delivery: "In 4 business days",
    expectedDelivery: "In 4 business days",
    delivery_address: "B-204, Riverview Heights, Kalyani Nagar",
    city: "Pune",
    pincode: "411006",
    cancellation_eligible: true,
    cancellationEligible: true,
    return_eligible: false,
    notes: "COD order processing. Customer can cancel before dispatch.",
  },
  "ORD-107": {
    id: "ORD-107",
    order_id: "ORD-107",
    customer_name: "Meera Nair",
    customerName: "Meera Nair",
    phone_last4: "6023",
    email: "meera.nair@example.com",
    items: ["Vitamin C Brightening Face Scrub"],
    product: "Vitamin C Brightening Face Scrub",
    item_count: 1,
    subtotal: 550,
    shipping_fee: 0,
    total_amount: 550,
    value: "₹550",
    amount: 550,
    payment_method: "UPI",
    payment_status: "Paid",
    order_status: "Delivered",
    status: "Delivered",
    order_date: "2026-09-26",
    deliveredAgo: "2 days ago",
    delivery_address: "Plot 55, Jubilee Hills",
    city: "Hyderabad",
    pincode: "500033",
    courier: "BlueDart",
    tracking_id: "BD-771923",
    trackingNumber: "BD-771923",
    cancellation_eligible: false,
    cancellationEligible: false,
    return_eligible: true,
    return_deadline: "Within 5 days (7-day window active)",
    notes: "Delivered 2 days ago. Return is eligible if unopened in original box.",
  },
  "ORD-108": {
    id: "ORD-108",
    order_id: "ORD-108",
    customer_name: "Aditya Joshi",
    customerName: "Aditya Joshi",
    phone_last4: "9012",
    email: "aditya.j@example.com",
    items: ["Salicylic Acid 2% Exfoliating Toner"],
    product: "Salicylic Acid 2% Toner",
    item_count: 1,
    subtotal: 420,
    shipping_fee: 50,
    total_amount: 470,
    value: "₹470",
    amount: 470,
    payment_method: "Cash on Delivery",
    payment_status: "Paid",
    order_status: "Delivered",
    status: "Delivered",
    order_date: "2026-09-20",
    deliveredAgo: "10 days ago",
    delivery_address: "Flat 101, Shanti Niketan, Alkapuri",
    city: "Vadodara",
    pincode: "390007",
    courier: "Shadowfax",
    tracking_id: "SF-109283",
    trackingNumber: "SF-109283",
    cancellation_eligible: false,
    cancellationEligible: false,
    return_eligible: false,
    notes: "Delivered 10 days ago. Not eligible for return (passed 7-day limit).",
  },
  "ORD-109": {
    id: "ORD-109",
    order_id: "ORD-109",
    customer_name: "Pooja Deshmukh",
    customerName: "Pooja Deshmukh",
    phone_last4: "5541",
    email: "pooja.d@example.com",
    items: ["Peptide Anti-Aging Eye Gel", "SPF 50 Sunscreen Stick"],
    product: "Peptide Eye Gel + Sunscreen Stick",
    item_count: 2,
    subtotal: 980,
    shipping_fee: 0,
    total_amount: 980,
    value: "₹980",
    amount: 980,
    payment_method: "UPI",
    payment_status: "Paid",
    order_status: "Out for Delivery",
    status: "Out for Delivery",
    order_date: "2026-09-28",
    expected_delivery: "5 PM today",
    expectedDelivery: "5 PM today",
    delivery_address: "Row House 3, Baner Pashan Link Rd",
    city: "Pune",
    pincode: "411045",
    courier: "Delhivery",
    tracking_id: "DL-992104",
    trackingNumber: "DL-992104",
    cancellation_eligible: false,
    cancellationEligible: false,
    return_eligible: false,
    notes: "Out for delivery. Customer can refuse delivery if not wanted.",
  },
  "ORD-110": {
    id: "ORD-110",
    order_id: "ORD-110",
    customer_name: "Kabir Mehta",
    customerName: "Kabir Mehta",
    phone_last4: "2289",
    email: "kabir.m@example.com",
    items: ["Kumkumadi Glow Facial Oil"],
    product: "Kumkumadi Glow Facial Oil",
    item_count: 1,
    subtotal: 1250,
    shipping_fee: 0,
    total_amount: 1250,
    value: "₹1,250",
    amount: 1250,
    payment_method: "Credit Card",
    payment_status: "Refunded",
    order_status: "Cancelled",
    status: "Cancelled",
    order_date: "2026-09-27",
    delivery_address: "15, Park Street",
    city: "Kolkata",
    pincode: "700016",
    cancellation_eligible: false,
    cancellationEligible: false,
    return_eligible: false,
    notes: "Order was already cancelled while in processing. Refund initiated.",
  },
};

// In-memory active state of orders
export const MOCK_ORDERS: Record<string, Order> = JSON.parse(JSON.stringify(INITIAL_MOCK_ORDERS));

/**
 * Normalized order ID search (e.g. ord 101, ord-101, ORD101 -> ORD-101)
 */
export function normalizeOrderId(rawId: string): string {
  if (!rawId) return "";
  const cleaned = rawId.toUpperCase().replace(/\s+/g, "").replace(/[^A-Z0-9-]/g, "");
  
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

/**
 * Returns all current mock orders (reflecting live updates).
 */
export function getAllMockOrders(): Order[] {
  return Object.values(MOCK_ORDERS);
}

/**
 * Real cancellation action that modifies order state in memory:
 * Allowed ONLY when order_status === "Processing"
 */
export function cancelOrderInDb(orderId: string): { success: boolean; order?: Order; message: string } {
  const normalized = normalizeOrderId(orderId);
  const order = MOCK_ORDERS[normalized];

  if (!order) {
    return {
      success: false,
      message: `Order ${normalized || orderId} could not be located in our system.`,
    };
  }

  if (order.order_status === "Cancelled") {
    return {
      success: false,
      order,
      message: `Order ${order.id} has already been cancelled.`,
    };
  }

  if (order.order_status !== "Processing") {
    return {
      success: false,
      order,
      message: `Order ${order.id} cannot be cancelled because it is already ${order.order_status}.`,
    };
  }

  // Perform actual state change
  order.order_status = "Cancelled";
  order.status = "Cancelled";
  order.cancellation_eligible = false;
  order.cancellationEligible = false;
  order.payment_status = "Refunded";
  order.notes = "Cancelled by customer via ARIA AI customer support.";

  return {
    success: true,
    order,
    message: `Done. Your order ${order.id} has been cancelled successfully.`,
  };
}

/**
 * Resets database back to initial state (for clean test runs).
 */
export function resetMockOrders(): void {
  for (const key of Object.keys(MOCK_ORDERS)) {
    delete MOCK_ORDERS[key];
  }
  Object.assign(MOCK_ORDERS, JSON.parse(JSON.stringify(INITIAL_MOCK_ORDERS)));
}
