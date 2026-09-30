// Comprehensive test suite for all 20 exact assessment conversations
import { processIntelligentTurn, Message } from "../lib/agent/chat-engine";
import { getOrderById, getAuditLog } from "../lib/orders/database";

console.log("===============================================================");
console.log("🧪 RUNNING 20 EXACT TEST CONVERSATIONS FOR ARIA AI AGENT");
console.log("===============================================================\n");

let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, testName: string, details: string = "") {
  totalCount++;
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passedCount++;
  } else {
    console.error(`❌ [FAIL] ${testName}: ${details}`);
  }
}

// Helper to run a turn and test
function testSingle(query: string, expectedIntent: string, responseMustInclude: string[], testTitle: string) {
  const res = processIntelligentTurn([{ role: "user", content: query }]);
  const intentMatches = res.detectedIntent === expectedIntent;
  const replyLower = res.reply.toLowerCase();
  const textMatches = responseMustInclude.every((substr) => replyLower.includes(substr.toLowerCase()));

  assert(
    intentMatches && textMatches,
    testTitle,
    `Query: "${query}" | Intent: ${res.detectedIntent} (expected: ${expectedIntent}) | Reply: "${res.reply}"`
  );
  return res;
}

// 1. “Which order did I return?”
testSingle(
  "Which order did I return?",
  "RETURNED_ORDER_LOOKUP",
  ["records", "order id"],
  "1. Which order did I return?"
);

// 2. “Tell me the order I returned.”
testSingle(
  "Tell me the order I returned.",
  "RETURNED_ORDER_LOOKUP",
  ["record", "order"],
  "2. Tell me the order I returned."
);

// 3. “Which product did I send back?”
testSingle(
  "Which product did I send back?",
  "RETURNED_ORDER_LOOKUP",
  ["records", "order"],
  "3. Which product did I send back?"
);

// 4. “Where is my order?”
testSingle(
  "Where is my order?",
  "ORDER_STATUS",
  ["order id"],
  "4. Where is my order?"
);

// 5. “My order is 101.”
testSingle(
  "My order is 101.",
  "ORDER_ID_PROVIDED",
  ["vitamin c serum", "bluedart", "6 pm"],
  "5. My order is 101."
);

// 6. Multi-turn: "Can I cancel it?" after ORD-101
console.log("\n--- Multi-turn Memory Test (ORD-101 -> Can I cancel it?) ---");
const turn6 = processIntelligentTurn([
  { role: "user", content: "Where is my order?" },
  { role: "assistant", content: "Sure, what is your order ID?" },
  { role: "user", content: "My order is 101." },
  { role: "assistant", content: "Your Vitamin C Serum order is currently out for delivery through BlueDart and is expected by 6 PM today." },
  { role: "user", content: "Can I cancel it?" }, // "it" resolves to ORD-101
]);
assert(
  (turn6.reply.toLowerCase().includes("cannot be cancelled") || turn6.reply.toLowerCase().includes("can't be cancelled")) &&
  turn6.reply.toLowerCase().includes("refuse"),
  "6. Can I cancel it? (Memory correctly recognized 'it' as ORD-101 and rejected cancellation)"
);

// 7. “Can I return my sunscreen?” (sunscreen = ORD-102, delivered 14 days ago)
testSingle(
  "Can I return my sunscreen?",
  "RETURN_ELIGIBILITY",
  ["14 days ago", "outside"],
  "7. Can I return my sunscreen? (ORD-102 outside 7-day window)"
);

// 8. “I received it 14 days ago, can I return it?”
testSingle(
  "I received it 14 days ago, can I return it?",
  "RETURN_ELIGIBILITY",
  ["7 days", "outside"],
  "8. I received it 14 days ago, can I return it?"
);

// 9. “Can I cancel my order which is already out for delivery?”
testSingle(
  "Can I cancel my order which is already out for delivery?",
  "CANCELLATION_ELIGIBILITY",
  ["cannot be cancelled", "refuse"],
  "9. Can I cancel my order which is already out for delivery?"
);

// 10. “mera order kaha hai?” (Hinglish)
testSingle(
  "mera order kaha hai?",
  "ORDER_STATUS",
  ["order id"],
  "10. mera order kaha hai? (Hinglish order tracking)"
);

// 11. “ye return ho sakta hai?” (Hinglish)
testSingle(
  "ye return ho sakta hai?",
  "RETURN_ELIGIBILITY",
  ["7 din", "unopened"],
  "11. ye return ho sakta hai? (Hinglish return inquiry)"
);

// 12. “what happens if my package is damaged?”
testSingle(
  "what happens if my package is damaged?",
  "DAMAGED_PRODUCT",
  ["48 hours", "photos", "replacement"],
  "12. what happens if my package is damaged?"
);

// 13. “Can you book me a flight?”
testSingle(
  "Can you book me a flight?",
  "OUT_OF_SCOPE",
  ["aura skincare", "can't assist"],
  "13. Can you book me a flight? (Polite out-of-scope redirection)"
);

// 14. “I don't know my order ID.”
testSingle(
  "I don't know my order ID.",
  "ORDER_ID_MISSING",
  ["sms", "email", "ord-101"],
  "14. I don't know my order ID. (Helpful ID location advice)"
);

// 15. “the order I bought yesterday” (Maps to ORD-103 placed recently)
testSingle(
  "the order I bought yesterday",
  "ORDER_LOOKUP",
  ["green tea", "processing"],
  "15. the order I bought yesterday (Resolves to recent order ORD-103)"
);

// 16. “return wala order batao” (Hinglish returned order lookup)
testSingle(
  "return wala order batao",
  "RETURNED_ORDER_LOOKUP",
  ["records", "order id"],
  "16. return wala order batao (Hinglish returned order lookup)"
);

// 17. Multi-turn: “which product did I order?” with context ORD-101
console.log("\n--- Multi-turn Memory Test (Which product did I order?) ---");
const turn17 = processIntelligentTurn([
  { role: "user", content: "My order is 101" },
  { role: "assistant", content: "Your order is ORD-101." },
  { role: "user", content: "which product did I order?" },
]);
assert(
  turn17.reply.toLowerCase().includes("vitamin c serum"),
  "17. which product did I order? (Memory identified Vitamin C Serum for ORD-101)"
);

// 18. Multi-turn: “tell me about my order” with context ORD-103
console.log("\n--- Multi-turn Memory Test (Tell me about my order) ---");
const turn18 = processIntelligentTurn([
  { role: "user", content: "ORD-103" },
  { role: "assistant", content: "Checking ORD-103." },
  { role: "user", content: "tell me about my order" },
]);
assert(
  turn18.reply.toLowerCase().includes("green tea") && turn18.reply.toLowerCase().includes("processing"),
  "18. tell me about my order (Memory retrieved status for ORD-103)"
);

// 19. “can I cancel the serum?” (serum = ORD-101, Out for Delivery)
testSingle(
  "can I cancel the serum?",
  "CANCELLATION_ELIGIBILITY",
  ["cannot be cancelled", "refuse"],
  "19. can I cancel the serum? (Resolved serum to ORD-101 and rejected cancellation)"
);

// 20. “I want my money back.”
testSingle(
  "I want my money back.",
  "REFUND",
  ["refund", "7-day"],
  "20. I want my money back. (Refund policy explanation)"
);

// 21. Real Cancellation Two-Step Confirmation Flow (ORD-103)
console.log("\n--- Two-Step Cancellation Confirmation Test (ORD-103) ---");
const turn21a = processIntelligentTurn([
  { role: "user", content: "Please cancel ORD-103" },
]);
assert(
  turn21a.reply.toLowerCase().includes("eligible for cancellation") &&
  turn21a.reply.toLowerCase().includes("would you like me to"),
  "21a. Cancel ORD-103 (Asks for customer confirmation before cancelling, does not cancel yet)"
);

const turn21b = processIntelligentTurn([
  { role: "user", content: "Please cancel ORD-103" },
  { role: "assistant", content: "Order ORD-103 is currently being processed and is eligible for cancellation. Would you like me to go ahead and cancel it for you?" },
  { role: "user", content: "Yes, please cancel it" },
]);
assert(
  turn21b.reply.toLowerCase().includes("has been cancelled successfully") &&
  turn21b.reply.toLowerCase().includes("ord-103"),
  "21b. Customer confirms cancellation (Calls cancel_order and confirms successful cancellation)"
);

// 21c. Post-Cancellation Status Lookup (ORD-103)
const turn21c = processIntelligentTurn([
  { role: "user", content: "What's the status of ORD-103?" },
]);
assert(
  turn21c.reply.toLowerCase().includes("cancelled") &&
  !turn21c.reply.toLowerCase().includes("processing"),
  "21c. Post-Cancellation Status Lookup (ORD-103 shows Cancelled, NOT Processing)"
);

// 21d. Cannot cancel again (ORD-103)
const turn21d = processIntelligentTurn([
  { role: "user", content: "Cancel ORD-103 again" },
]);
assert(
  turn21d.reply.toLowerCase().includes("already been cancelled") &&
  !turn21d.toolCallsExecuted.some((t) => t.tool === "cancel_order"),
  "21d. Cannot cancel again (Rejects with 'already been cancelled', no second cancellation tool call)"
);

// 21e. Cancellation Audit Event
const auditLog = getAuditLog();
const hasAudit = auditLog.some(
  (e) => e.order_id === "ORD-103" && e.event === "ORDER_CANCELLED" && e.confirmed_by_customer === true
);
assert(hasAudit, "21e. Cancellation Audit Event (Recorded ORDER_CANCELLED event for ORD-103 with timestamp)");

// 21f. Underlying Order Database State Mutation
const order103 = getOrderById("ORD-103");
assert(
  order103?.order_status === "Cancelled" &&
  order103?.cancellation_eligible === false &&
  order103?.cancelled === true &&
  typeof order103?.cancelled_at === "string",
  "21f. Underlying Order State (Single source of truth updated with cancelled: true and cancelled_at timestamp)"
);

// 22. Negative Cancellation: Shipped Order (ORD-105)
console.log("\n--- Negative Cancellation Test: Shipped Order (ORD-105) ---");
const turn22 = processIntelligentTurn([
  { role: "user", content: "Can I cancel ORD-105?" },
]);
assert(
  turn22.reply.toLowerCase().includes("already shipped") &&
  turn22.reply.toLowerCase().includes("cannot be cancelled"),
  "22. Cancel Shipped ORD-105 (Rejects cancellation because already shipped)"
);

// 23. Negative Cancellation: Out for Delivery (ORD-101)
console.log("\n--- Negative Cancellation Test: Out for Delivery (ORD-101) ---");
const turn23 = processIntelligentTurn([
  { role: "user", content: "Cancel order 101" },
]);
assert(
  turn23.reply.toLowerCase().includes("cannot be cancelled") &&
  turn23.reply.toLowerCase().includes("refuse"),
  "23. Cancel Out for Delivery ORD-101 (Rejects cancellation, advises doorstep refusal)"
);

// 24. Negative Cancellation: Already Cancelled (ORD-110)
console.log("\n--- Negative Cancellation Test: Already Cancelled (ORD-110) ---");
const turn24 = processIntelligentTurn([
  { role: "user", content: "I want to cancel ORD-110" },
]);
assert(
  turn24.reply.toLowerCase().includes("already been cancelled"),
  "24. Cancel Already Cancelled ORD-110 (States already cancelled)"
);

// 25. Cancellation Confirmation Declined (ORD-104)
console.log("\n--- Cancellation Declined Test (ORD-104) ---");
const turn25 = processIntelligentTurn([
  { role: "user", content: "Cancel ORD-104" },
  { role: "assistant", content: "Order ORD-104 is currently being processed and is eligible for cancellation. Would you like me to go ahead and cancel it for you?" },
  { role: "user", content: "No, don't cancel it" },
]);
assert(
  turn25.reply.toLowerCase().includes("not cancelled") &&
  turn25.reply.toLowerCase().includes("continue processing"),
  "25. Customer declines cancellation (Cancellation aborted, processing continues)"
);

// 26. Delivery Address Query (ORD-101)
console.log("\n--- Delivery Address Query Test (ORD-101) ---");
const turn26 = processIntelligentTurn([
  { role: "user", content: "Where will ORD-101 be delivered?" },
]);
assert(
  turn26.reply.toLowerCase().includes("indiranagar") &&
  turn26.reply.toLowerCase().includes("bengaluru") &&
  turn26.reply.toLowerCase().includes("560038"),
  "26. Where will ORD-101 be delivered? (Returns correct street address, city, and pincode)"
);

// 27. Delivery Address Query (ORD-103)
console.log("\n--- Delivery Address Query Test (ORD-103) ---");
const turn27 = processIntelligentTurn([
  { role: "user", content: "What is the delivery address for ORD-103?" },
]);
assert(
  turn27.reply.toLowerCase().includes("churchgate") &&
  turn27.reply.toLowerCase().includes("mumbai") &&
  turn27.reply.toLowerCase().includes("400020"),
  "27. Delivery address for ORD-103 (Returns Mumbai address and pincode)"
);

// 28. Order Contents Query (ORD-104)
console.log("\n--- Order Contents Query Test (ORD-104) ---");
const turn28 = processIntelligentTurn([
  { role: "user", content: "What did I order in ORD-104?" },
]);
assert(
  turn28.reply.toLowerCase().includes("niacinamide") &&
  turn28.reply.toLowerCase().includes("night cream"),
  "28. What did I order in ORD-104? (Lists item contents accurately)"
);

// 29. Payment Method Query (ORD-106)
console.log("\n--- Payment Details Query Test (ORD-106) ---");
const turn29 = processIntelligentTurn([
  { role: "user", content: "How did I pay for ORD-106?" },
]);
assert(
  turn29.reply.toLowerCase().includes("cash on delivery"),
  "29. How did I pay for ORD-106? (Identifies Cash on Delivery payment method)"
);

// 30. Hinglish Natural Question
console.log("\n--- Hinglish Natural Question Test ---");
const turn30 = processIntelligentTurn([
  { role: "user", content: "mera order kab ayega" },
]);
assert(
  turn30.reply.toLowerCase().includes("order id") ||
  turn30.reply.toLowerCase().includes("batayein"),
  "30. mera order kab ayega (Natural Hinglish understanding asks for Order ID politely)"
);

console.log("\n===============================================================");
console.log(`FINAL RESULTS: ${passedCount} / ${totalCount} CONVERSATIONS PASSED`);
console.log("===============================================================");

if (passedCount !== totalCount) {
  process.exit(1);
}
