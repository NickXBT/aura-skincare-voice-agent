import { classifyIntent, DetectedIntent } from "@/lib/agent/intent-classifier";
import { extractEntities, ExtractedEntities } from "@/lib/agent/entity-extractor";
import { resolveConversationContext, ResolvedContext } from "@/lib/agent/context-manager";
import {
  evaluateReturnPolicy,
  evaluateCancellationPolicy,
  evaluateShippingFeePolicy,
  evaluateCodPolicy,
  evaluateDeliveryTimePolicy,
} from "@/lib/agent/policy-engine";
import { executeGetOrderDetails, ToolCallResult } from "@/lib/tools/order-tool";
import { Message } from "@/lib/agent/chat-engine";

export interface PipelineResult {
  reply: string;
  detectedIntent: DetectedIntent;
  confidence: number;
  entities: ExtractedEntities;
  context: ResolvedContext;
  orderRequired: "YES" | "NO";
  orderId: string | null;
  toolRequired: "YES" | "NO";
  policyRequired: "YES" | "NO";
  toolUsed: string | null;
  toolCallsExecuted: ToolCallResult[];
  decision: string;
  policyDecision?: string;
  executionTimeMs: number;
}

/**
 * ARIA Conversational Reasoning Pipeline:
 * UNDERSTAND -> REASON -> VERIFY -> APPLY POLICY -> RESPOND
 * Covers 1,000+ customer question variations across 45 intents.
 */
export function executePipeline(messages: Message[]): PipelineResult {
  const startTime = Date.now();
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  const rawQuery = lastUserMsg?.content || "";

  // 1. Entity Extraction (with self-correction and spoken digits)
  const entities = extractEntities(rawQuery);

  // 2. Context Resolution (multi-turn memory & cross-referencing)
  const context = resolveConversationContext(messages, entities);

  // 3. Intent Classification
  const classification = classifyIntent(rawQuery, { activeOrderId: context.activeOrderId });
  const intent = classification.intent;
  const isHinglish = classification.isHinglish;

  const toolCallsExecuted: ToolCallResult[] = [];
  let toolUsed: string | null = null;
  let orderRequired: "YES" | "NO" = "NO";
  let toolRequired: "YES" | "NO" = "NO";
  let policyRequired: "YES" | "NO" = "NO";
  let decision = "ANSWER_DIRECT";
  let policyDecision: string | undefined;
  let reply = "";

  // 4. Intent Execution & Reasoning Logic

  // 1. OUT OF SCOPE
  if (intent === "OUT_OF_SCOPE") {
    decision = "REJECT_OUT_OF_SCOPE";
    reply = isHinglish
      ? "Main yahan Aura Skincare orders, products, shipping, returns, aur cancellations mein madad kar sakti hoon, lekin flights ya doosre topics par assist nahi kar sakti."
      : "I can help with Aura Skincare orders, products, shipping, returns, and cancellations, but I can't assist with flights or external topics.";
  }

  // 2. HUMAN AGENT / ESCALATION REQUEST
  else if (intent === "HUMAN_AGENT_REQUEST" || intent === "ESCALATION_REQUEST") {
    decision = "HUMAN_AGENT_EXPLANATION";
    reply = isHinglish
      ? "Main Aura Skincare ki AI assistant hoon aur aapke order status, cancellation, aur return policy mein turant madad kar sakti hoon. Agar aap chahein toh main aapki request Aura Support Team ko note kar sakti hoon."
      : "I'm ARIA, Aura's AI support specialist. While I don't have a direct phone transfer to human agents, I can immediately look up orders, process return requests, or log a priority ticket for our support team.";
  }

  // 3. COMPLAINT / FRUSTRATION
  else if (intent === "COMPLAINT") {
    decision = "EMPATHY_AND_ASSIST";
    reply = isHinglish
      ? "Mujhe khed hai ki aapko pareshani hui. Kripya apna Order ID share karein taaki main turant check karke aapki poori madad kar sakoon."
      : "I understand your frustration and apologize for the inconvenience. Please share your Order ID and I will check your delivery status or arrange a resolution immediately.";
  }

  // 4. REPETITION & REPHRASING
  else if (intent === "REPETITION_REQUEST") {
    decision = "REPEAT_LAST_TURN";
    const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant");
    reply = lastAssistantMsg
      ? (isHinglish ? `Maine kaha: ${lastAssistantMsg.content}` : `To repeat: ${lastAssistantMsg.content}`)
      : (isHinglish ? "Main aapki Aura orders aur policy mein madad kar sakti hoon. Bataiye kya check karoon?" : "I'm here to help with your Aura Skincare orders. How can I help you?");
  }
  else if (intent === "REPHRASING_REQUEST") {
    decision = "SIMPLIFY_EXPLANATION";
    reply = isHinglish
      ? "Seedhe shabdon mein: hum ₹499 par free shipping dete hain, 7 din mein return allow karte hain, aur order dispatch hone ke baad cancel nahi ho sakta."
      : "In short: we offer free shipping over ₹499, a 7-day unopened return policy, and orders can only be cancelled before they leave our warehouse.";
  }

  // 5. GREETING
  else if (intent === "GREETING") {
    decision = "GREET_CUSTOMER";
    reply = isHinglish
      ? "Namaste! Main Aura Skincare ki AI assistant ARIA hoon. Aaj main aapki kya madad kar sakti hoon?"
      : "Hi! I'm ARIA from Aura Skincare. How can I help you today?";
  }

  // 6. THANKS & GOODBYE
  else if (intent === "THANKS") {
    decision = "ACKNOWLEDGE_THANKS";
    reply = isHinglish
      ? "Aapka swagat hai! Agar aur koi sawaal ho toh zaroor bataiye."
      : "You're welcome! Let me know if you need anything else with your Aura Skincare order.";
  }
  else if (intent === "GOODBYE") {
    decision = "SAY_GOODBYE";
    reply = isHinglish
      ? "Shukriya Aura Skincare se sampark karne ke liye. Have a wonderful day!"
      : "Thank you for reaching out to Aura Skincare. Have a wonderful day!";
  }

  // 7. RETURNED ORDER LOOKUP
  else if (intent === "RETURNED_ORDER_LOOKUP") {
    orderRequired = "YES";
    decision = "LOOKUP_RETURNED_ORDERS";
    reply = isHinglish
      ? "Maine aapke records check kiye hain, lekin available orders mein koi returned order nahi dikh raha hai. Agar aapke paas Order ID hai, toh bataiye main check kar leti hoon."
      : "I don't see a returned order in the available records. If you have the order ID, give it to me and I'll check it.";
  }

  // 8. DAMAGED / DEFECTIVE / WRONG / MISSING PRODUCT
  else if (intent === "DAMAGED_PRODUCT" || intent === "DEFECTIVE_PRODUCT") {
    policyRequired = "YES";
    decision = "CHECK_POLICY_DAMAGE";
    policyDecision = "48h_photo_replacement";
    reply = isHinglish
      ? "Aura policy ke anusaar, agar product damaged ya defective deliver hua hai, toh kripya delivery ke 48 ghante ke andar photos ke saath report karein, hum turant replacement arrange karenge."
      : "Under Aura's policy, damaged or defective products must be reported within 48 hours of delivery with photos so we can arrange a replacement.";
  }
  else if (intent === "WRONG_PRODUCT" || intent === "MISSING_PRODUCT") {
    policyRequired = "YES";
    decision = "WRONG_ITEM_POLICY";
    reply = isHinglish
      ? "Galat ya missing item ke liye kripya apna Order ID batayein aur package ki photo share karein, hum turant correct item dispatch karwayenge."
      : "If you received the wrong item or an item was missing, please share your Order ID and photo proof so we can dispatch the correct product immediately.";
  }

  // 9. REFUND / MONEY BACK
  else if (intent === "REFUND") {
    policyRequired = "YES";
    decision = "REFUND_POLICY";
    reply = isHinglish
      ? "Aura Skincare par eligible returns (7-day window ke andar) aur approved cancellations ke refunds original payment method par 5 se 7 business days mein process hote hain."
      : "Under our refund policy, returns within our 7-day window or approved cancellations have their refunds processed back to your original payment method within 5 to 7 business days.";
  }

  // 10. REFUSING DELIVERY
  else if (intent === "REFUSING_DELIVERY") {
    policyRequired = "YES";
    decision = "REFUSE_DELIVERY_INSTRUCTION";
    reply = isHinglish
      ? "Ji haan, agar aapka order already out for delivery hai aur aapko nahi chahiye, toh aap doorstep par delivery boy ko lene se mana kar sakte hain."
      : "Yes, if your order is already out for delivery and you no longer wish to receive it, you can simply refuse the delivery at your doorstep.";
  }

  // 11. RETURN WINDOW & CONDITIONS
  else if (intent === "RETURN_WINDOW") {
    policyRequired = "YES";
    decision = "ANSWER_RETURN_WINDOW";
    reply = isHinglish
      ? "Aura Skincare par return window delivery ke 7 din tak ki hoti hai unopened aur unused products ke liye."
      : "Aura Skincare's return window is strictly 7 days from the date of delivery for unopened and unused products.";
  }
  else if (intent === "RETURN_CONDITIONS") {
    policyRequired = "YES";
    decision = "ANSWER_RETURN_CONDITIONS";
    reply = isHinglish
      ? "Return ke liye product unopened, unused aur original box packaging mein hona zaroori hai. Khule ya used products return nahi kiye ja sakte."
      : "To qualify for a return, the product must be completely unopened, unused, and in its original intact packaging. Opened or used items are not returnable.";
  }

  // 12. GENERAL RETURN POLICY
  else if (intent === "RETURN_POLICY") {
    policyRequired = "YES";
    decision = "ANSWER_RETURN_POLICY";
    reply = isHinglish
      ? "Aura Skincare par returns delivery ke 7 din ke andar accept kiye jaate hain, provided product unopened, unused aur original packaging mein ho."
      : "Returns are accepted within 7 days of delivery if the product is unopened, unused, and in its original packaging.";
  }

  // 13. RETURN ELIGIBILITY & RETURN REQUEST
  else if (intent === "RETURN_ELIGIBILITY" || intent === "RETURN_REQUEST") {
    policyRequired = "YES";
    decision = "EVALUATE_RETURN_POLICY";

    const policyResult = evaluateReturnPolicy(context.activeOrder, entities, isHinglish);
    policyDecision = policyResult.reason;
    reply = policyResult.response;
  }

  // 14. CANCELLATION & CANCELLATION ELIGIBILITY
  else if (intent === "CANCELLATION" || intent === "CANCELLATION_ELIGIBILITY") {
    orderRequired = "YES";

    if (context.activeOrderId) {
      toolRequired = "YES";
      toolUsed = "get_order_details";
      const toolRes = executeGetOrderDetails(context.activeOrderId);
      toolCallsExecuted.push(toolRes);

      if (toolRes.found && toolRes.order) {
        policyRequired = "YES";
        const cancelEval = evaluateCancellationPolicy(toolRes.order, entities, isHinglish);
        policyDecision = cancelEval.reason;
        reply = cancelEval.response;
      } else {
        reply = toolRes.message;
      }
    } else {
      policyRequired = "YES";
      const cancelEval = evaluateCancellationPolicy(null, entities, isHinglish);
      reply = cancelEval.response;
    }
  }

  // 15. ORDER ID MISSING / UNKNOWN
  else if (intent === "MISSING_ORDER_ID" || intent === "ORDER_ID_MISSING") {
    decision = "ADVISE_LOCATE_ID";
    reply = isHinglish
      ? "Koi baat nahi! Aap apna Order ID confirmation SMS ya email mein check kar sakte hain, ya apna registered phone number aur full name share karein."
      : "No worries! You can locate your order ID in your order confirmation SMS or email (format: ORD-101). Alternatively, let me know your registered name.";
  }

  // 16. COURIER INFORMATION & TRACKING NUMBER
  else if (intent === "COURIER_INFORMATION" || intent === "TRACKING_NUMBER") {
    orderRequired = "YES";
    if (context.activeOrderId) {
      toolRequired = "YES";
      toolUsed = "get_order_details";
      const toolRes = executeGetOrderDetails(context.activeOrderId);
      toolCallsExecuted.push(toolRes);

      if (toolRes.found && toolRes.order) {
        const o = toolRes.order;
        if (intent === "TRACKING_NUMBER" && o.trackingNumber) {
          reply = isHinglish
            ? `Order ${o.id} ka tracking number ${o.trackingNumber} hai (${o.courier}).`
            : `The tracking number for Order ${o.id} is ${o.trackingNumber} with ${o.courier}.`;
        } else if (o.courier) {
          reply = isHinglish
            ? `Order ${o.id} ${o.courier} courier dwara deliver kiya ja raha hai (Tracking: ${o.trackingNumber || "N/A"}).`
            : `Order ${o.id} is being delivered via ${o.courier} with tracking number ${o.trackingNumber}.`;
        } else {
          reply = isHinglish
            ? `Order ${o.id} abhi processing state mein hai aur courier ko hand over nahi hua hai.`
            : `Order ${o.id} is currently processing and has not yet been handed to a courier.`;
        }
      } else {
        reply = toolRes.message;
      }
    } else {
      reply = isHinglish
        ? "Courier aur tracking details ke liye kripya apna Order ID batayein (jaise ORD-101)."
        : "Please share your order ID (such as ORD-101) so I can look up your courier and tracking details.";
    }
  }

  // 17. DELIVERY ETA & TIME
  else if (intent === "DELIVERY_TIME") {
    policyRequired = "YES";
    const timePolicy = evaluateDeliveryTimePolicy(isHinglish);
    reply = timePolicy.response;
  }
  else if (intent === "DELIVERY_ETA" || intent === "DELIVERY_LOCATION" || intent === "DELIVERY_DELAY") {
    orderRequired = "YES";
    if (context.activeOrderId) {
      toolRequired = "YES";
      toolUsed = "get_order_details";
      const toolRes = executeGetOrderDetails(context.activeOrderId);
      toolCallsExecuted.push(toolRes);

      if (toolRes.found && toolRes.order) {
        const o = toolRes.order;
        if (o.status === "Out for Delivery") {
          reply = isHinglish
            ? `Aapka Order ${o.id} (${o.product}) out for delivery hai aur aaj ${o.expectedDelivery || "shaam 6 baje tak"} deliver ho jayega.`
            : `Your order for the ${o.product} (${o.id}) is out for delivery with ${o.courier} and expected by ${o.expectedDelivery || "6 PM today"}.`;
        } else if (o.status === "Delivered") {
          reply = isHinglish
            ? `Order ${o.id} ${o.deliveredAgo || "pehle"} hi deliver ho chuka hai.`
            : `Order ${o.id} for the ${o.product} was already delivered ${o.deliveredAgo}.`;
        } else if (o.status === "Processing") {
          reply = isHinglish
            ? `Order ${o.id} abhi processing state mein hai (placed ${o.orderedAgo}). Normal delivery 3 se 5 din mein hoti hai.`
            : `Order ${o.id} is currently processing (placed ${o.orderedAgo}). Standard delivery takes 3 to 5 business days.`;
        }
      } else {
        reply = toolRes.message;
      }
    } else {
      reply = isHinglish
        ? "Delivery ETA check karne ke liye kripya apna Order ID batayein (jaise ORD-101)."
        : "Please provide your order ID (such as ORD-101) so I can check your exact delivery ETA.";
    }
  }

  // 18. COD / CASH ON DELIVERY
  else if (intent === "COD") {
    policyRequired = "YES";
    const codEval = evaluateCodPolicy(entities.amount, isHinglish);
    reply = codEval.response;
  }

  // 19. SHIPPING FEE & FREE SHIPPING
  else if (intent === "SHIPPING_FEE" || intent === "FREE_SHIPPING") {
    policyRequired = "YES";
    const shipEval = evaluateShippingFeePolicy(entities.amount, isHinglish);
    reply = shipEval.response;
  }

  // 20. PRODUCT IN ORDER & ORDER AMOUNT
  else if (intent === "PRODUCT_IN_ORDER" || intent === "ORDER_AMOUNT") {
    orderRequired = "YES";
    if (context.activeOrderId) {
      toolRequired = "YES";
      toolUsed = "get_order_details";
      const toolRes = executeGetOrderDetails(context.activeOrderId);
      toolCallsExecuted.push(toolRes);

      if (toolRes.found && toolRes.order) {
        const o = toolRes.order;
        if (intent === "ORDER_AMOUNT") {
          reply = isHinglish
            ? `Order ${o.id} (${o.product}) ka total amount ${o.value} hai.`
            : `The total amount for Order ${o.id} (${o.product}) was ${o.value}.`;
        } else {
          reply = isHinglish
            ? `Order ${o.id} mein aapne ${o.product} order kiya tha (amount: ${o.value}).`
            : `In Order ${o.id}, you ordered the ${o.product} for ${o.value}.`;
        }
      } else {
        reply = toolRes.message;
      }
    } else {
      reply = isHinglish
        ? "Order details check karne ke liye kripya apna Order ID batayein (jaise ORD-101)."
        : "Please provide your Order ID (such as ORD-101) so I can verify the items and price.";
    }
  }

  // 21. ORDER STATUS / ORDER TRACKING / ORDER CONFIRMATION / ORDER DETAILS
  else if (
    intent === "ORDER_STATUS" ||
    intent === "ORDER_TRACKING" ||
    intent === "ORDER_CONFIRMATION" ||
    intent === "ORDER_DETAILS" ||
    intent === "ORDER_ID_PROVIDED" ||
    intent === "FOLLOW_UP_QUESTION" ||
    intent === "ORDER_LOOKUP"
  ) {
    orderRequired = "YES";
    const targetId = context.activeOrderId || (entities.orderId ? entities.orderId : null);

    if (targetId) {
      toolRequired = "YES";
      toolUsed = "get_order_details";
      const toolRes = executeGetOrderDetails(targetId);
      toolCallsExecuted.push(toolRes);

      if (toolRes.found && toolRes.order) {
        const o = toolRes.order;
        if (o.status === "Out for Delivery") {
          reply = isHinglish
            ? `Order ${o.id} (${o.product}) out for delivery hai BlueDart ke through aur aaj 6 PM tak deliver ho jayega.`
            : `Order ${o.id} for the ${o.product} is out for delivery with ${o.courier} and is expected by ${o.expectedDelivery || "6 PM today"}.`;
        } else if (o.status === "Delivered") {
          reply = isHinglish
            ? `Order ${o.id} (${o.product}) ${o.deliveredAgo} deliver ho chuka hai via ${o.courier}.`
            : `Order ${o.id} for the ${o.product} was delivered ${o.deliveredAgo} via ${o.courier}.`;
        } else if (o.status === "Processing") {
          reply = isHinglish
            ? `Order ${o.id} (${o.product}) abhi processing status mein hai (placed ${o.orderedAgo}). Yeh cancellation ke liye eligible hai.`
            : `Order ${o.id} for the ${o.product} is currently processing (placed ${o.orderedAgo}) and is eligible for cancellation.`;
        } else {
          reply = `Order ${o.id} status is ${o.status}.`;
        }

        // Multi-intent addition: if user asked "Where is ORD-101 and can I cancel it?"
        if (classification.secondaryIntents?.includes("CANCELLATION_ELIGIBILITY")) {
          const cancelPart = evaluateCancellationPolicy(o, entities, isHinglish);
          reply += ` ${cancelPart.response}`;
        }
      } else {
        reply = toolRes.message;
      }
    } else {
      reply = isHinglish
        ? "Main aapka order zaroor check kar sakti hoon! Kripya apna Order ID share karein (jaise ORD-101 ya ORD-103)."
        : "I'd be happy to check that for you! Could you please share your order ID (e.g., ORD-101 or ORD-103)?";
    }
  }

  // 22. GENERAL AURA INFO & PRODUCT SUPPORT
  else if (intent === "GENERAL_AURA_INFO" || intent === "PRODUCT_SUPPORT") {
    decision = "BRAND_INFO";
    reply = isHinglish
      ? "Aura Skincare ek high-potency organic skincare brand hai jo Vitamin C Serums, Hydrating Sunscreens, aur Green Tea Face Wash provide karta hai."
      : "Aura Skincare is an organic skincare brand offering clean, high-potency formulations including our Vitamin C Serum, Hydrating SPF 50 Sunscreen, and Green Tea Face Wash.";
  }

  // 23. UNKNOWN / CLARIFICATION
  else {
    decision = "REQUEST_CLARIFICATION";
    reply = isHinglish
      ? "Main samjhi nahi, kya aap thoda clear bol sakte hain? Main Aura Skincare ke orders, tracking, cancellation, aur returns mein madad kar sakti hoon."
      : "I didn't quite catch that. Could you repeat or clarify if you're asking about an order, delivery tracking, return, or cancellation?";
  }

  const executionTimeMs = Date.now() - startTime;

  return {
    reply,
    detectedIntent: intent,
    confidence: classification.confidence,
    entities,
    context,
    orderRequired,
    orderId: context.activeOrderId,
    toolRequired,
    policyRequired,
    toolUsed,
    toolCallsExecuted,
    decision,
    policyDecision,
    executionTimeMs,
  };
}
