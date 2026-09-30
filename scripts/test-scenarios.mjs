// Standalone scenario verification test script
import { MOCK_ORDERS, getOrderById, normalizeOrderId } from "../lib/orders/database.js";
import { executeGetOrderDetails } from "../lib/tools/order-tool.js";
import { processDeterministicTurn } from "../lib/agent/chat-engine.js";
import { generateCallSummary } from "../lib/agent/call-summary.js";

console.log("=================================================");
console.log("🧪 TESTING AURA SKINCARE VOICE AGENT SCENARIOS");
console.log("=================================================\n");

let passedCount = 0;
let totalCount = 0;

function assert(condition, testName, details = "") {
  totalCount++;
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passedCount++;
  } else {
    console.error(`❌ [FAIL] ${testName}: ${details}`);
  }
}

// 1. Tool execution tests
console.log("--- 1. Order Tool Execution Tests ---");
const tool101 = executeGetOrderDetails("ORD-101");
assert(tool101.found === true, "ORD-101 should be found");
assert(tool101.order?.status === "Out for Delivery", "ORD-101 status is Out for Delivery");
assert(tool101.order?.courier === "BlueDart", "ORD-101 courier is BlueDart");

const tool102 = executeGetOrderDetails("ORD-102");
assert(tool102.found === true, "ORD-102 should be found");
assert(tool102.order?.status === "Delivered", "ORD-102 status is Delivered");

const tool103 = executeGetOrderDetails("ORD-103");
assert(tool103.found === true, "ORD-103 should be found");
assert(tool103.order?.cancellationEligible === true, "ORD-103 is eligible for cancellation");

const tool999 = executeGetOrderDetails("ORD-999");
assert(tool999.found === false, "ORD-999 should NOT be found");

// 2. Scenario A: 20 days ago and opened return test
console.log("\n--- 2. Scenario A: Return Policy Check ---");
const turnA = processDeterministicTurn([
  { role: "user", content: "I bought this 20 days ago and opened it. Can I return it?" }
]);
assert(
  turnA.reply.toLowerCase().includes("cannot accept") || turnA.reply.toLowerCase().includes("not eligible"),
  "Scenario A: Correctly rejects return of opened item after 20 days"
);
assert(turnA.detectedIntent === "RETURN_REQUEST", "Scenario A: Intent identified as RETURN_REQUEST");

// 3. Scenario B: Where is my order ORD-101?
console.log("\n--- 3. Scenario B: Order Tracking ORD-101 ---");
const turnB = processDeterministicTurn([
  { role: "user", content: "Where is my order ORD-101?" }
]);
assert(turnB.toolCallsExecuted.length > 0, "Scenario B: Executed tool get_order_details");
assert(turnB.reply.includes("ORD-101"), "Scenario B: Mentions ORD-101 in reply");
assert(turnB.reply.includes("Out for Delivery"), "Scenario B: Explains Out for Delivery status");
assert(turnB.reply.includes("BlueDart"), "Scenario B: Mentions courier BlueDart");

// 4. Scenario C: Cancel ORD-103
console.log("\n--- 4. Scenario C: Cancel Processing Order ORD-103 ---");
const turnC = processDeterministicTurn([
  { role: "user", content: "Cancel ORD-103." }
]);
assert(turnC.toolCallsExecuted.length > 0, "Scenario C: Executed order lookup tool");
assert(turnC.reply.toLowerCase().includes("processing"), "Scenario C: Notes processing status");
assert(
  turnC.reply.toLowerCase().includes("eligible for cancellation") || turnC.reply.toLowerCase().includes("initiated the cancellation"),
  "Scenario C: Confirms cancellation eligibility"
);

// 5. Scenario D: Cancel ORD-101 (Out for delivery)
console.log("\n--- 5. Scenario D: Ineligible Cancellation ORD-101 ---");
const turnD = processDeterministicTurn([
  { role: "user", content: "Cancel ORD-101." }
]);
assert(turnD.toolCallsExecuted.length > 0, "Scenario D: Executed order lookup tool");
assert(
  turnD.reply.toLowerCase().includes("cannot be cancelled") || turnD.reply.toLowerCase().includes("refuse delivery"),
  "Scenario D: Explains order cannot be cancelled and advises refusing delivery at doorstep"
);

// 6. Scenario E: Can you book me a flight to Goa?
console.log("\n--- 6. Scenario E: Out-of-Scope Flight Booking ---");
const turnE = processDeterministicTurn([
  { role: "user", content: "Can you book me a flight to Goa?" }
]);
assert(turnE.detectedIntent === "OUT_OF_SCOPE", "Scenario E: Detected intent as OUT_OF_SCOPE");
assert(
  turnE.reply.toLowerCase().includes("aura skincare") && (turnE.reply.toLowerCase().includes("only assist") || turnE.reply.toLowerCase().includes("apologize")),
  "Scenario E: Guardrail enforces brand boundary politely"
);

// 7. Scenario F: Non-existent order ORD-999
console.log("\n--- 7. Scenario F: Non-existent Order ORD-999 ---");
const turnF = processDeterministicTurn([
  { role: "user", content: "My order number is ORD-999." }
]);
assert(turnF.toolCallsExecuted.length > 0, "Scenario F: Executed lookup tool for ORD-999");
assert(turnF.toolCallsExecuted[0].found === false, "Scenario F: Tool returned found=false");
assert(
  turnF.reply.toLowerCase().includes("could not") && turnF.reply.toLowerCase().includes("verify"),
  "Scenario F: Asks customer to verify order number without hallucinating"
);

// 8. Brand Policy Tests: Shipping and COD
console.log("\n--- 8. Brand Policies: Shipping & COD ---");
const turnShip = processDeterministicTurn([
  { role: "user", content: "What is your shipping policy?" }
]);
assert(turnShip.reply.includes("499") && turnShip.reply.includes("50"), "Shipping policy mentions ₹499 free threshold and ₹50 fee");

const turnCOD = processDeterministicTurn([
  { role: "user", content: "Do you offer COD?" }
]);
assert(turnCOD.reply.includes("2,500"), "COD policy mentions ₹2,500 limit");

// 9. Post-Call Intelligence Summary Generation
console.log("\n--- 9. Post-Call Intelligence & Analytics ---");
const mockCallHistory = [
  { role: "assistant", content: "Hello! Welcome to Aura Skincare. How can I help?" },
  { role: "user", content: "Where is my order ORD-101?" },
  { role: "assistant", content: turnB.reply },
];
const summaryReport = generateCallSummary(mockCallHistory, turnB.toolCallsExecuted);
assert(summaryReport.outcome.customer_intent === "ORDER_TRACKING", "Summary: Intent identified as ORDER_TRACKING");
assert(summaryReport.outcome.order_id === "ORD-101", "Summary: Order ID identified as ORD-101");
assert(summaryReport.outcome.resolution_status === "RESOLVED", "Summary: Resolution status is RESOLVED");
assert(summaryReport.agentQuality.toolCallsCount === 1, "Summary: Recorded 1 tool call");
assert(summaryReport.agentQuality.issueResolved === true, "Summary: Issue resolved flagged true");

console.log("\n=================================================");
console.log(`RESULTS: ${passedCount} / ${totalCount} TESTS PASSED`);
console.log("=================================================");
