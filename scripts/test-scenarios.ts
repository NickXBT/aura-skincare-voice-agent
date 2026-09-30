// Comprehensive test suite for all 20 exact assessment conversations
import { processIntelligentTurn, Message } from "../lib/agent/chat-engine";

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

console.log("\n===============================================================");
console.log(`FINAL RESULTS: ${passedCount} / ${totalCount} CONVERSATIONS PASSED`);
console.log("===============================================================");

if (passedCount !== totalCount) {
  process.exit(1);
}
