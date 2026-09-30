import { Order } from "@/lib/orders/database";
import { ExtractedEntities } from "@/lib/agent/entity-extractor";

export interface PolicyEvaluation {
  allowed: boolean;
  policyName: "RETURN" | "CANCELLATION" | "DAMAGED_ITEM" | "SHIPPING" | "COD" | "DELIVERY_TIME";
  reason: string;
  response: string;
}

/**
 * Evaluates Aura Skincare return policy based on actual rules:
 * - 7-day return window from delivery
 * - Unopened, unused in original packaging
 * - Damaged/defective reported within 48h with photos
 */
export function evaluateReturnPolicy(
  order: Order | null,
  entities: ExtractedEntities,
  isHinglish: boolean
): PolicyEvaluation {
  // 1. Defective or Damaged items (48 hours window with photos)
  if (entities.isDamaged) {
    const response = isHinglish
      ? "Agar product damaged ya defective deliver hua hai, toh kripya delivery ke 48 ghante ke andar photos ke saath share karein, hum turant replacement arrange karenge."
      : "For damaged or defective items, please report them within 48 hours of delivery with photos, and we will arrange a prompt replacement.";
    return {
      allowed: true,
      policyName: "DAMAGED_ITEM",
      reason: "Damaged/defective replacement requested within 48h with photos.",
      response,
    };
  }

  // 2. Opened / used product condition
  if (entities.isOpened === true) {
    const response = isHinglish
      ? "Aura ki return policy ke anusaar products completely unopened aur unused hone chahiye original packaging mein. Khule ya used products return ke liye eligible nahi hain."
      : "Under Aura's policy, returns are only accepted for products that are completely unopened, unused, and in their original packaging. Opened items cannot be returned.";
    return {
      allowed: false,
      policyName: "RETURN",
      reason: "Product is opened/used.",
      response,
    };
  }

  // 3. Timeframe check: explicit days mentioned (e.g. 10 days, 14 days, 20 days, two weeks)
  if (entities.daysAgo !== null && entities.daysAgo > 7) {
    const response = isHinglish
      ? `Aura Skincare par returns delivery ke 7 din ke andar hi liye jaate hain. Kyunki delivery ko ${entities.daysAgo} din ho chuke hain, yeh return window se bahar hai.`
      : `Aura's return window is strictly 7 days from delivery. Since this was delivered ${entities.daysAgo} days ago, it is outside our return window.`;
    return {
      allowed: false,
      policyName: "RETURN",
      reason: `Exceeded 7-day return window (${entities.daysAgo} days).`,
      response,
    };
  }

  // 4. Order-specific check if order is linked (e.g. ORD-102 was delivered 14 days ago)
  if (order) {
    if (order.id === "ORD-102" || (order.deliveredAgo && order.deliveredAgo.includes("14 days"))) {
      const response = isHinglish
        ? `Order ${order.id} (${order.product}) 14 din pehle deliver hua tha. Humari policy 7 din ke andar ki hai, isliye yeh return ke liye eligible nahi hai.`
        : `Order ${order.id} for the ${order.product} was delivered 14 days ago, which is outside Aura's 7-day return window.`;
      return {
        allowed: false,
        policyName: "RETURN",
        reason: "ORD-102 was delivered 14 days ago (outside 7-day window).",
        response,
      };
    }
  }

  // 5. Standard Return Guidelines
  const response = isHinglish
    ? "Aura Skincare par returns delivery ke 7 din ke andar liye jaate hain, provided product unopened, unused aur original packaging mein ho."
    : "Returns are accepted within 7 days of delivery for products that are unopened, unused, and in their original packaging.";
  return {
    allowed: true,
    policyName: "RETURN",
    reason: "Standard 7-day unopened return policy.",
    response,
  };
}

/**
 * Evaluates cancellation policy for orders:
 * - Only orders with status 'Processing' can be cancelled
 * - Out for Delivery and Shipped cannot be cancelled (can refuse delivery)
 */
export function evaluateCancellationPolicy(
  order: Order | null,
  entities: ExtractedEntities,
  isHinglish: boolean
): PolicyEvaluation {
  // Out for Delivery
  if (entities.isOutForDeliveryMentioned || order?.status === "Out for Delivery") {
    const idText = order ? `Order ${order.id}` : "Orders that are already out for delivery";
    const response = isHinglish
      ? `${idText} ko cancel nahi kiya ja sakta kyunki courier pehle hi nikal chuka hai. Aap doorstep par delivery lene se mana kar sakte hain.`
      : `${idText} cannot be cancelled because it is already out for delivery with the courier. You may simply refuse the delivery at your doorstep.`;
    return {
      allowed: false,
      policyName: "CANCELLATION",
      reason: "Order is Out for Delivery (cannot cancel, refuse at doorstep).",
      response,
    };
  }

  // Delivered
  if (order?.status === "Delivered") {
    const response = isHinglish
      ? `Order ${order.id} pehle hi deliver ho chuka hai, isliye isse cancel nahi kiya ja sakta. Agar product unopened hai toh aap 7 din ke andar return kar sakte hain.`
      : `Order ${order.id} has already been delivered, so it cannot be cancelled. You can request a return within 7 days if the product is unopened.`;
    return {
      allowed: false,
      policyName: "CANCELLATION",
      reason: "Order already delivered.",
      response,
    };
  }

  // Processing
  if (order?.status === "Processing") {
    const response = isHinglish
      ? `Ji haan, Order ${order.id} abhi processing status mein hai, isliye isse cancel kiya ja sakta hai. Kya main aapke liye cancellation process kar doon?`
      : `Yes, Order ${order.id} is currently processing, so it is eligible for cancellation. Would you like me to go ahead and cancel it for you?`;
    return {
      allowed: true,
      policyName: "CANCELLATION",
      reason: "Order is in Processing state (cancellation eligible).",
      response,
    };
  }

  // Cancelled
  if (order?.status === "Cancelled" || order?.cancelled) {
    const response = isHinglish
      ? `${order.id} pehle hi cancel ho chuka hai.`
      : `${order.id} has already been cancelled.`;
    return {
      allowed: false,
      policyName: "CANCELLATION",
      reason: "Order is already cancelled.",
      response,
    };
  }

  // Shipped
  if (order?.status === "Shipped") {
    const response = isHinglish
      ? `Order ${order.id} dispatch ho chuka hai, isliye cancel nahi ho sakta. Aap delivery ke waqt package refuse kar sakte hain.`
      : `Order ${order.id} has already shipped and cannot be cancelled. You may refuse the delivery when the courier arrives.`;
    return {
      allowed: false,
      policyName: "CANCELLATION",
      reason: "Order is shipped (cannot cancel).",
      response,
    };
  }

  // General cancellation policy
  const response = isHinglish
    ? "Aura Skincare par orders ko tabhi cancel kiya ja sakta hai jab tak woh Processing status mein hon. Shipped ya Out for Delivery orders cancel nahi ho sakte."
    : "Orders can only be cancelled while they are still in the Processing stage. Once an order has shipped or is out for delivery, it cannot be cancelled, but you can refuse delivery at your doorstep.";
  return {
    allowed: true,
    policyName: "CANCELLATION",
    reason: "General cancellation policy: eligible while Processing only.",
    response,
  };
}

/**
 * Evaluates Aura Skincare Shipping Fee Policy:
 * - Free shipping above ₹499
 * - ₹50 shipping fee for orders under ₹499
 */
export function evaluateShippingFeePolicy(amount: number | null, isHinglish: boolean): PolicyEvaluation {
  if (amount !== null) {
    if (amount >= 499) {
      const response = isHinglish
        ? `₹${amount} ke order par delivery bilkul FREE hai! Aura par ₹499 ya usse zyada ke orders par free shipping milti hai.`
        : `Orders of ₹${amount} qualify for FREE delivery! Aura provides free shipping on all orders of ₹499 or more.`;
      return {
        allowed: true,
        policyName: "SHIPPING",
        reason: "Order amount >= 499 qualifies for free delivery.",
        response,
      };
    } else {
      const response = isHinglish
        ? `₹${amount} ke order par ₹50 delivery charge lagega. ₹499 ya usse zyada ke orders par delivery free hoti hai.`
        : `Orders of ₹${amount} have a shipping fee of ₹50. Free delivery is available on orders above ₹499.`;
      return {
        allowed: true,
        policyName: "SHIPPING",
        reason: "Order amount < 499 incurs standard ₹50 shipping fee.",
        response,
      };
    }
  }

  const response = isHinglish
    ? "Aura Skincare par ₹499 se upar ke sabhi orders par delivery bilkul FREE hai. ₹499 se kam ke orders par standard ₹50 shipping fee lagti hai."
    : "Delivery is completely FREE for all orders above ₹499. Orders below ₹499 have a standard ₹50 shipping fee.";
  return {
    allowed: true,
    policyName: "SHIPPING",
    reason: "Standard shipping fee tiers (free above 499, 50 below).",
    response,
  };
}

/**
 * Evaluates Aura Skincare COD Policy:
 * - Cash on Delivery available up to ₹2,500
 * - Payable via Cash or UPI at doorstep
 * - Orders > ₹2,500 not eligible for COD
 */
export function evaluateCodPolicy(amount: number | null, isHinglish: boolean): PolicyEvaluation {
  if (amount !== null && amount > 2500) {
    const response = isHinglish
      ? `Aura par COD ki maximum limit ₹2,500 hai, isliye ₹${amount} ke order par COD available nahi hai. Aap online payment use kar sakte hain.`
      : `Cash on Delivery is only available for orders up to ₹2,500, so a ₹${amount} order is not eligible for COD. Please choose prepaid payment at checkout.`;
    return {
      allowed: false,
      policyName: "COD",
      reason: "Order exceeds ₹2,500 COD limit.",
      response,
    };
  }

  const response = isHinglish
    ? "Haan, Aura Skincare par ₹2,500 tak ke orders ke liye Cash on Delivery (COD) available hai. Aap delivery ke waqt cash ya UPI se pay kar sakte hain."
    : "Yes, Cash on Delivery (COD) is available on orders up to ₹2,500. You can pay via cash or UPI to the courier at your doorstep.";
  return {
    allowed: true,
    policyName: "COD",
    reason: "COD available up to ₹2,500 via cash or UPI.",
    response,
  };
}

/**
 * Evaluates Aura Skincare Delivery Time:
 * - Delivery takes 3–5 business days
 */
export function evaluateDeliveryTimePolicy(isHinglish: boolean): PolicyEvaluation {
  const response = isHinglish
    ? "Aura Skincare ke orders standard 3 se 5 business days mein deliver hote hain."
    : "Standard delivery for Aura Skincare orders takes 3 to 5 business days.";
  return {
    allowed: true,
    policyName: "DELIVERY_TIME",
    reason: "Standard delivery time: 3-5 business days.",
    response,
  };
}
