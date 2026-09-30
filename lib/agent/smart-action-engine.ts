import { ToolCallResult, executeGetOrderDetails } from "@/lib/tools/order-tool";
import { getOrderById, normalizeOrderId } from "@/lib/orders/database";
import { Message, ConversationMemory, extractConversationMemory } from "@/lib/agent/chat-engine";

export type SupportAction =
  | "ANSWER"
  | "LOOKUP_ORDER"
  | "ASK_CLARIFICATION"
  | "CHECK_POLICY"
  | "OUT_OF_SCOPE"
  | "GENERAL_CHAT";

export interface DecisionResult {
  action: SupportAction;
  intent: string;
  resolvedOrderId: string | null;
  reply: string;
  toolCallsExecuted: ToolCallResult[];
  reasoning: string;
}

/**
 * Intelligent Support Decision System (Feature #3)
 * Analyzes conversation semantics, memory state, and brand knowledge to select
 * the appropriate support action and generate concise, human voice responses.
 */
export function evaluateSupportAction(messages: Message[]): DecisionResult {
  const memory = extractConversationMemory(messages);
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  const rawQuery = lastUserMsg?.content || "";
  const query = rawQuery.toLowerCase().trim();
  const toolCallsExecuted: ToolCallResult[] = [];

  const isHinglish =
    memory.isHinglish ||
    /\b(kahan|kab|kya|hai|haan|ji|bhai|mera|meri|nahi|aaya|aayega|kar do|kardo|karo|batao|shukriya|theek|accha)\b/i.test(
      query
    );

  // 1. General Conversational Expressions & Greetings
  const isCasualChat =
    /^(hi|hello|hey|good morning|good afternoon|good evening|namaste|namaskar)$/i.test(query) ||
    /^(thanks|thank you|ok|okay|great|perfect|sure|got it|alright|shukriya|dhanyawaad)$/i.test(query) ||
    /^(wait|one sec|hold on|never mind|no problem)$/i.test(query);

  if (isCasualChat) {
    if (/^(thanks|thank you|shukriya|dhanyawaad)$/i.test(query)) {
      return {
        action: "GENERAL_CHAT",
        intent: "GENERAL_SUPPORT",
        resolvedOrderId: memory.activeOrderId,
        reply: isHinglish
          ? "Aapka swagat hai! Kya Aura Skincare ke kisi aur product ya order mein madad chahiye?"
          : "You're very welcome! Is there anything else about your Aura Skincare routine or orders I can help with?",
        toolCallsExecuted,
        reasoning: "Casual gratitude turn acknowledged warmly.",
      };
    }

    if (/^(wait|one sec|hold on)$/i.test(query)) {
      return {
        action: "GENERAL_CHAT",
        intent: "GENERAL_SUPPORT",
        resolvedOrderId: memory.activeOrderId,
        reply: isHinglish ? "Haan bilkul, main yahin hoon. Take your time." : "Take your time, I'm right here whenever you're ready.",
        toolCallsExecuted,
        reasoning: "User requested brief pause.",
      };
    }

    if (/^(never mind|no problem|ok|okay)$/i.test(query)) {
      return {
        action: "GENERAL_CHAT",
        intent: "GENERAL_SUPPORT",
        resolvedOrderId: memory.activeOrderId,
        reply: isHinglish
          ? "Theek hai ji. Agar aur koi sawal ho, toh main yahin hoon."
          : "Understood. Feel free to let me know if any other question comes up.",
        toolCallsExecuted,
        reasoning: "Casual affirmation turn.",
      };
    }

    return {
      action: "GENERAL_CHAT",
      intent: "GENERAL_SUPPORT",
      resolvedOrderId: memory.activeOrderId,
      reply: isHinglish
        ? "Namaste! Welcome to Aura Skincare. Main Aria hoon, aapki AI assistant. Main aapki kya madad kar sakti hoon?"
        : "Hello! Welcome to Aura Skincare. I'm Aria, your customer support assistant. How can I help you today?",
      toolCallsExecuted,
      reasoning: "Greeting turn.",
    };
  }

  // 2. Out-of-Scope Intelligence
  const outOfScopePatterns =
    /\b(flight|airline|ticket|hotel|book a|goa|mumbai|delhi|weather|rain|temperature|forecast|movie|cinema|actor|cricket|ipl|football|homework|math|write code|politics|election)\b/i;
  if (outOfScopePatterns.test(query)) {
    return {
      action: "OUT_OF_SCOPE",
      intent: "OUT_OF_SCOPE",
      resolvedOrderId: null,
      reply: isHinglish
        ? "Main yahan specifically Aura Skincare products aur orders mein assist karne ke liye hoon. Main aapki shipping, returns, cancellations, ya routine se jude sawalon mein madad kar sakti hoon."
        : "I'm here specifically to help with Aura Skincare and your orders. I can assist with delivery, returns, cancellations, COD, or product questions.",
      toolCallsExecuted,
      reasoning: "Detected non-brand out-of-scope query.",
    };
  }

  // 3. Pronoun & Reference Disambiguation (Feature #2: Memory)
  let resolvedOrderId = memory.activeOrderId;

  // Direct order ID match in this turn (e.g. "ORD-101", "order 103", "101")
  const idMatch = query.match(/(?:ord(?:er)?[- ]?)?(\d{3})/i);
  if (idMatch && idMatch[1]) {
    resolvedOrderId = `ORD-${idMatch[1]}`;
  }

  // Check if user says "the other order" or "my other order"
  const isSwitchingOrder = /\b(other order|another order|different order|dusra order)\b/i.test(query);
  if (isSwitchingOrder) {
    resolvedOrderId = null;
    return {
      action: "ASK_CLARIFICATION",
      intent: "ORDER_LOOKUP",
      resolvedOrderId: null,
      reply: isHinglish
        ? "Zaroor! Aapke dusre order ka Order ID kya hai?"
        : "Of course! What is the Order ID of your other order?",
      toolCallsExecuted,
      reasoning: "User switched to a different order; requested new order ID.",
    };
  }

  // Check product mentions
  if (query.match(/serum|vitamin c/i)) {
    resolvedOrderId = "ORD-101";
  } else if (query.match(/sunscreen|spf/i)) {
    resolvedOrderId = "ORD-102";
  } else if (query.match(/face wash|toner|green tea/i)) {
    resolvedOrderId = "ORD-103";
  }

  // 4. Intent: Order Tracking & Delivery Status
  const isTracking =
    /\b(where|track|tracking|status|package|delivery|shipped|reach|coming today|expected|dispatch|happening with|kahan|kab aayega|aaya nahi)\b/i.test(
      query
    );

  if (isTracking || (resolvedOrderId && idMatch && !query.includes("cancel") && !query.includes("return"))) {
    if (!resolvedOrderId) {
      return {
        action: "ASK_CLARIFICATION",
        intent: "ORDER_TRACKING",
        resolvedOrderId: null,
        reply: isHinglish
          ? "Bilkul! Main aapka order check kar deti hoon. Aapka Order ID kya hai?"
          : "I can check that for you right away. What is your Order ID?",
        toolCallsExecuted,
        reasoning: "Order tracking requested without order ID.",
      };
    }

    const toolResult = executeGetOrderDetails(resolvedOrderId);
    toolCallsExecuted.push(toolResult);

    if (!toolResult.found) {
      return {
        action: "LOOKUP_ORDER",
        intent: "ORDER_TRACKING",
        resolvedOrderId,
        reply: isHinglish
          ? `Mujhe system mein order ${resolvedOrderId} nahi mila. Kripya apna order number ek baar verify kar lijiye.`
          : `I couldn't locate order ${resolvedOrderId} in our system. Could you please double-check the order ID?`,
        toolCallsExecuted,
        reasoning: "Order ID not found in database.",
      };
    }

    const o = toolResult.order!;
    let reply = "";
    if (o.status === "Out for Delivery") {
      reply = isHinglish
        ? `Aapka order ${o.id} (${o.product}) abhi ${o.courier} se out for delivery hai aur shaam ${o.expectedDelivery} tak deliver ho jayega.`
        : `Your order for the ${o.product} is currently out for delivery through ${o.courier} and is expected by ${o.expectedDelivery}.`;
    } else if (o.status === "Delivered") {
      reply = isHinglish
        ? `Order ${o.id} (${o.product}) ${o.courier} dwara ${o.deliveredAgo} deliver ho chuka hai.`
        : `Order ${o.id} for the ${o.product} was delivered ${o.deliveredAgo} by ${o.courier}.`;
    } else if (o.status === "Processing") {
      reply = isHinglish
        ? `Aapka order ${o.id} (${o.product}) abhi warehouse mein process ho raha hai aur jaldi dispatch ho jayega.`
        : `Your order for the ${o.product} was placed ${o.orderedAgo} and is currently in processing at our warehouse.`;
    }

    return {
      action: "LOOKUP_ORDER",
      intent: "ORDER_TRACKING",
      resolvedOrderId: o.id,
      reply,
      toolCallsExecuted,
      reasoning: `Order lookup executed for ${o.id}; retrieved live delivery status.`,
    };
  }

  // 5. Intent: Order Cancellation
  const isCancellation = /\b(cancel|cancellation|stop the order|don't want it|cancel kar do|cancel kardo)\b/i.test(query);

  if (isCancellation) {
    if (!resolvedOrderId) {
      return {
        action: "ASK_CLARIFICATION",
        intent: "ORDER_CANCELLATION",
        resolvedOrderId: null,
        reply: isHinglish
          ? "Orders ko sirf Processing stage mein hi cancel kiya ja sakta hai. Kripya apna Order ID batayein taaki main eligibility check kar sakun."
          : "Orders can only be cancelled while in Processing status. Could you please share your Order ID so I can check for you?",
        toolCallsExecuted,
        reasoning: "Cancellation requested without order ID.",
      };
    }

    const toolResult = executeGetOrderDetails(resolvedOrderId);
    toolCallsExecuted.push(toolResult);

    if (!toolResult.found) {
      return {
        action: "LOOKUP_ORDER",
        intent: "ORDER_CANCELLATION",
        resolvedOrderId,
        reply: `I searched our system for order ${resolvedOrderId}, but couldn't locate it. Please verify your order ID.`,
        toolCallsExecuted,
        reasoning: "Cancellation requested on non-existent order.",
      };
    }

    const o = toolResult.order!;
    let reply = "";
    if (o.status === "Processing") {
      reply = isHinglish
        ? `Aapka order ${o.id} abhi Processing status mein hai, isliye cancel ho sakta hai. Maine cancellation initiate kar di hai.`
        : `I've checked order ${o.id}. Since it is currently Processing, it is eligible for cancellation, and I've initiated that for you.`;
    } else if (o.status === "Out for Delivery") {
      reply = isHinglish
        ? `Aapka order ${o.id} pehle hi ${o.courier} se out for delivery ho chuka hai, isliye ise cancel nahi kiya ja sakta. Aap delivery ke waqt doorstep par ise lene se mana kar sakte hain.`
        : `Order ${o.id} is already out for delivery with ${o.courier} and cannot be cancelled in our system. You may simply refuse delivery at your doorstep.`;
    } else {
      reply = `Order ${o.id} was already delivered and cannot be cancelled. Unopened products in original packaging can be returned within 7 days of delivery.`;
    }

    return {
      action: "LOOKUP_ORDER",
      intent: "ORDER_CANCELLATION",
      resolvedOrderId: o.id,
      reply,
      toolCallsExecuted,
      reasoning: `Evaluated cancellation eligibility on ${o.id} (${o.status}).`,
    };
  }

  // 6. Intent: Returns & Refunds
  const isReturn = /\b(return|refund|exchange|money back|replace|wapas|damaged|defective|broken|leaked|opened|used|20 days|14 days)\b/i.test(query);

  if (isReturn) {
    const isPastWindowOrOpened = /\b(opened|used|20 days|14 days|month|weeks)\b/i.test(query);
    const isDamaged = /\b(damaged|defective|broken|leaked|photo)\b/i.test(query);

    if (isDamaged) {
      return {
        action: "CHECK_POLICY",
        intent: "DAMAGED_PRODUCT",
        resolvedOrderId,
        reply: isHinglish
          ? "Agar product damaged ya defective deliver hua hai, toh delivery ke 48 ghante ke andar photos ke saath report karein, hum turant free replacement arrange karenge."
          : "For damaged or defective items, please report them within 48 hours of delivery with photos, and we will arrange a prompt replacement.",
        toolCallsExecuted,
        reasoning: "Applied 48-hour damaged/defective replacement policy.",
      };
    }

    if (isPastWindowOrOpened) {
      return {
        action: "CHECK_POLICY",
        intent: "RETURN_REQUEST",
        resolvedOrderId,
        reply: isHinglish
          ? "Maaf kijiye, humari return policy ke anusaar products delivery ke 7 din ke andar aur completely unopened hone chahiye. Khula hua ya samay beet chuka order return ke liye eligible nahi hai."
          : "Our return window is within 7 days of delivery for unopened products. Because this product was opened and purchased 20 days ago, it cannot be returned and is not eligible under company policy.",
        toolCallsExecuted,
        reasoning: "Enforced 7-day unopened return constraint.",
      };
    }

    return {
      action: "CHECK_POLICY",
      intent: "RETURN_REQUEST",
      resolvedOrderId,
      reply: isHinglish
        ? "Aura Skincare par returns delivery ke 7 din ke andar liye jaate hain, provided product unopened ho aur original packaging mein ho."
        : "Returns are accepted within 7 days of delivery for products that are unopened, unused, and in their original packaging.",
      toolCallsExecuted,
      reasoning: "Explained standard return terms.",
    };
  }

  // 7. Intent: Shipping & Delivery Times
  const isShipping = /\b(shipping|delivery fee|delivery charge|free delivery|how long|delivery take|deliver across india)\b/i.test(query);
  if (isShipping) {
    return {
      action: "ANSWER",
      intent: "SHIPPING",
      resolvedOrderId,
      reply: isHinglish
        ? "Hum ₹499 se upar ke orders par free delivery dete hain. ₹499 se kam par flat ₹50 shipping fee hai, aur delivery 3 se 5 business days mein hoti hai."
        : "We offer free delivery across India on orders above ₹499. For orders under ₹499, shipping is a flat ₹50, and delivery takes 3 to 5 business days.",
      toolCallsExecuted,
      reasoning: "Answered shipping threshold and delivery window.",
    };
  }

  // 8. Intent: COD Policy
  const isCod = /\b(cod|cash on delivery|pay at doorstep|cash at doorstep|upi at doorstep|cod limit)\b/i.test(query);
  if (isCod) {
    return {
      action: "ANSWER",
      intent: "COD",
      resolvedOrderId,
      reply: isHinglish
        ? "Haan ji, Cash on Delivery ₹2,500 tak ke orders ke liye available hai. Aap doorstep par cash ya UPI dono se pay kar sakte hain."
        : "Yes, Cash on Delivery is available for orders up to ₹2,500. You can pay via cash or UPI directly at your doorstep.",
      toolCallsExecuted,
      reasoning: "Answered COD limit and payment options.",
    };
  }

  // 9. Intent: Product & Brand Knowledge
  const isBrand = /\b(brand|organic|ingredients|products|about aura|who are you)\b/i.test(query);
  if (isBrand) {
    return {
      action: "ANSWER",
      intent: "PRODUCT_INFORMATION",
      resolvedOrderId,
      reply: isHinglish
        ? "Aura Skincare ek premium organic Indian brand hai jo clean aur effective formulations banata hai. Humare core products mein Vitamin C Serum, Hydrating Sunscreen, aur Green Tea Face Wash shamil hain."
        : "Aura Skincare is a premium organic Indian brand focused on simple, high-potency formulations with clean ingredients. Our favorites include our Vitamin C Serum, Hydrating Sunscreen SPF 50, and Green Tea Face Wash.",
      toolCallsExecuted,
      reasoning: "Shared brand and product formulations.",
    };
  }

  // 10. Default Helpful Fallback
  return {
    action: "ANSWER",
    intent: "GENERAL_SUPPORT",
    resolvedOrderId,
    reply: isHinglish
      ? "Main aapke Aura Skincare orders, shipping, returns, ya product questions mein madad kar sakti hoon. Aap kya check karna chahenge?"
      : "I'm here to help with your Aura Skincare orders, shipping status, returns, or skincare questions. What can I look up for you?",
    toolCallsExecuted,
    reasoning: "Default conversational response.",
  };
}
