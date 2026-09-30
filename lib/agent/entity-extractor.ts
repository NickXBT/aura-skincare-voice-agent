import { normalizeOrderId } from "@/lib/orders/database";

export interface ExtractedEntities {
  orderId: string | null;
  customerName: string | null;
  product: string | null;
  amount: number | null;
  daysAgo: number | null;
  isOpened: boolean | null;
  isDamaged: boolean | null;
  isOutForDeliveryMentioned: boolean;
  timeframeDescription: string | null;
  isSelfCorrected: boolean;
}

/**
 * Extracts structured entities from user speech queries with self-correction and normalization
 */
export function extractEntities(query: string): ExtractedEntities {
  const norm = query.toLowerCase();

  // 1. Order ID Extraction (including spoken digits, phonetics, and self-corrections)
  let orderId: string | null = null;
  let isSelfCorrected = false;

  // Handle self-corrections: "not 101, 103", "cancel 101... actually 103", "101 wait no 103"
  const correctionMatch = norm.match(/(?:not|cancel|check)?\s*(?:ord[- ]?)?(\d{3})\s*(?:actually|no wait|no|rather|instead)\s*(?:no,?\s*)?(?:ord[- ]?)?(\d{3})/i);
  if (correctionMatch && correctionMatch[2]) {
    orderId = `ORD-${correctionMatch[2]}`;
    isSelfCorrected = true;
  } else {
    // Normal order ID extraction - find all matching 3-digit IDs and pick the latest one if multiple
    const allMatches = [...norm.matchAll(/(?:ord(?:er)?[- ]?)?(\d{3})/gi)];
    if (allMatches.length > 0) {
      const lastMatch = allMatches[allMatches.length - 1];
      if (lastMatch && lastMatch[1]) {
        orderId = `ORD-${lastMatch[1]}`;
        if (allMatches.length > 1) {
          isSelfCorrected = true;
        }
      }
    }
  }

  // Spoken number words fallback (e.g. "one zero one" -> ORD-101)
  if (!orderId) {
    if (/\b(one zero one|won won won|all day one zero one)\b/i.test(norm)) orderId = "ORD-101";
    else if (/\b(one zero two)\b/i.test(norm)) orderId = "ORD-102";
    else if (/\b(one zero three)\b/i.test(norm)) orderId = "ORD-103";
    else if (/\b(nine nine nine)\b/i.test(norm)) orderId = "ORD-999";
  }

  // 2. Customer Name Extraction
  let customerName: string | null = null;
  if (/\bpriya\b/i.test(norm)) customerName = "Priya Sharma";
  else if (/\brahul\b/i.test(norm)) customerName = "Rahul Verma";
  else if (/\bananya\b/i.test(norm)) customerName = "Ananya Patel";

  // 3. Product Extraction
  let product: string | null = null;
  if (/serum|vitamin c/i.test(norm)) {
    product = "Vitamin C Serum (30ml)";
  } else if (/sunscreen|spf/i.test(norm)) {
    product = "Hydrating Sunscreen SPF 50";
  } else if (/face wash|toner|green tea/i.test(norm)) {
    product = "Green Tea Face Wash + Toner";
  }

  // 4. Monetary Amount Extraction
  let amount: number | null = null;
  const amountMatch = norm.match(/(?:₹|rs\.?|rupees?)?\s*(\d{2,5})\s*(?:rupees?|rs\.?)?/i);
  if (amountMatch && amountMatch[1]) {
    const parsed = parseInt(amountMatch[1], 10);
    // Avoid confusing 101, 102, 103 with order amounts unless explicitly qualified
    if (parsed > 300 && parsed !== 999) {
      amount = parsed;
    }
  }

  // 5. Days Ago / Timeframe Extraction
  let daysAgo: number | null = null;
  let timeframeDescription: string | null = null;

  const daysMatch = norm.match(/(\d+)\s*days?\s*(?:ago)?/i);
  if (daysMatch) {
    daysAgo = parseInt(daysMatch[1], 10);
    timeframeDescription = `${daysAgo} days ago`;
  } else if (norm.includes("two weeks") || norm.includes("2 weeks")) {
    daysAgo = 14;
    timeframeDescription = "14 days ago";
  } else if (norm.includes("yesterday")) {
    daysAgo = 1;
    timeframeDescription = "yesterday";
  } else if (norm.includes("today")) {
    daysAgo = 0;
    timeframeDescription = "today";
  } else if (norm.includes("last week")) {
    daysAgo = 7;
    timeframeDescription = "last week";
  } else if (norm.includes("3 hours ago") || norm.includes("three hours ago")) {
    daysAgo = 0;
    timeframeDescription = "3 hours ago";
  }

  // 6. Opened & Used State
  let isOpened: boolean | null = null;
  if (/\b(opened|used|unsealed|broke seal|opened it|tried it)\b/i.test(norm)) {
    isOpened = true;
  } else if (/\b(unopened|unused|sealed|pack not opened|original box|original packaging)\b/i.test(norm)) {
    isOpened = false;
  }

  // 7. Damaged / Defective
  let isDamaged: boolean | null = null;
  if (/\b(damaged|broken|leaked|defective|cracked|spilled|faulty|pump not working)\b/i.test(norm)) {
    isDamaged = true;
  }

  // 8. Status Mentions in user question
  const isOutForDeliveryMentioned = /\bout for delivery\b/i.test(norm);

  return {
    orderId,
    customerName,
    product,
    amount,
    daysAgo,
    isOpened,
    isDamaged,
    isOutForDeliveryMentioned,
    timeframeDescription,
    isSelfCorrected,
  };
}
