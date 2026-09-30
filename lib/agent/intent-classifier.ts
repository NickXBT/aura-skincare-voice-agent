export type DetectedIntent =
  | "ORDER_STATUS"
  | "ORDER_TRACKING"
  | "DELIVERY_ETA"
  | "DELIVERY_DELAY"
  | "DELIVERY_LOCATION"
  | "DELIVERY_ADDRESS"
  | "COURIER_INFORMATION"
  | "TRACKING_NUMBER"
  | "ORDER_CONFIRMATION"
  | "ORDER_DETAILS"
  | "PRODUCT_IN_ORDER"
  | "ORDER_AMOUNT"
  | "PAYMENT_INFORMATION"
  | "COD"
  | "SHIPPING_FEE"
  | "FREE_SHIPPING"
  | "DELIVERY_TIME"
  | "CANCELLATION"
  | "CANCELLATION_ELIGIBILITY"
  | "CONFIRM_ACTION"
  | "DECLINE_ACTION"
  | "RETURN_REQUEST"
  | "RETURN_ELIGIBILITY"
  | "RETURN_WINDOW"
  | "RETURN_CONDITIONS"
  | "RETURN_POLICY"
  | "RETURNED_ORDER_LOOKUP"
  | "DAMAGED_PRODUCT"
  | "DEFECTIVE_PRODUCT"
  | "WRONG_PRODUCT"
  | "MISSING_PRODUCT"
  | "PRODUCT_PACKAGING"
  | "REFUSING_DELIVERY"
  | "OUT_OF_SCOPE"
  | "UNKNOWN"
  | "INVALID_ORDER_ID"
  | "MISSING_ORDER_ID"
  | "ORDER_ID_MISSING"
  | "ORDER_LOOKUP"
  | "FOLLOW_UP_QUESTION"
  | "CONFIRMATION_QUESTION"
  | "POLICY_CLARIFICATION"
  | "PRODUCT_SUPPORT"
  | "GENERAL_AURA_INFO"
  | "GREETING"
  | "GOODBYE"
  | "THANKS"
  | "COMPLAINT"
  | "ESCALATION_REQUEST"
  | "HUMAN_AGENT_REQUEST"
  | "REPHRASING_REQUEST"
  | "REPETITION_REQUEST"
  | "ORDER_ID_PROVIDED"
  | "REFUND"
  | "CLARIFICATION";

export interface IntentClassificationResult {
  intent: DetectedIntent;
  confidence: number;
  isHinglish: boolean;
  normalizedQuery: string;
  secondaryIntents?: DetectedIntent[];
}

/**
 * Normalizes speech recognition phonetic glitches, Indian English phrasing, and typed typos
 */
export function normalizeTranscription(raw: string): string {
  let text = raw.toLowerCase().trim();

  // 1. Common voice transcription and speech-to-text glitches
  text = text
    .replace(/\border idea\b/g, "order id")
    .replace(/\border number\b/g, "order id")
    .replace(/\bsun screen\b/g, "sunscreen")
    .replace(/\bcouncil\b/g, "cancel")
    .replace(/\bwritten\b/g, "return")
    .replace(/\brita\b/g, "return")
    .replace(/\bwritten order\b/g, "return order")
    .replace(/\bseram\b/g, "serum")
    .replace(/\ball day one zero one\b/g, "ord-101")
    .replace(/\border won won won\b/g, "ord-101")
    .replace(/\b(?:order\s+)?one zero one\b/g, "ord-101")
    .replace(/\b(?:order\s+)?one zero two\b/g, "ord-102")
    .replace(/\b(?:order\s+)?one zero three\b/g, "ord-103")
    .replace(/\b(?:order\s+)?one zero four\b/g, "ord-104")
    .replace(/\b(?:order\s+)?one zero five\b/g, "ord-105")
    .replace(/\b(?:order\s+)?one zero six\b/g, "ord-106")
    .replace(/\b(?:order\s+)?one zero seven\b/g, "ord-107")
    .replace(/\b(?:order\s+)?one zero eight\b/g, "ord-108")
    .replace(/\b(?:order\s+)?one zero nine\b/g, "ord-109")
    .replace(/\b(?:order\s+)?one one zero\b|\b(?:order\s+)?one ten\b/g, "ord-110")
    .replace(/\bo r d\b/g, "ord")
    .replace(/\bo-r-d\b/g, "ord")
    .replace(/\bor der\b/g, "order");

  // 2. Common typo correction
  text = text
    .replace(/\bdelivary\b|\bdlvery\b|\bdelivry\b|\bdelivey\b/g, "delivery")
    .replace(/\bordr\b|\boder\b|\bodr\b|\borderd\b/g, "order")
    .replace(/\bcancell\b|\bcancle\b|\bcanceld\b|\bcancelling\b|\bcanceling\b/g, "cancel")
    .replace(/\bretun\b|\bretrn\b|\bretund\b|\breturnig\b/g, "return")
    .replace(/\bpakage\b|\bpackge\b|\bparcl\b|\bpkg\b/g, "package")
    .replace(/\btraking\b|\btrak\b|\btraked\b|\btrace\b/g, "tracking")
    .replace(/\bshiped\b|\bshipd\b|\bdispathed\b/g, "shipped")
    .replace(/\brecived\b|\brecieved\b/g, "received")
    .replace(/\bdefctive\b|\bdefectve\b|\bdefct\b/g, "defective")
    .replace(/\bdamged\b|\bdamaegd\b|\bbrokn\b|\bbrek\b/g, "damaged")
    .replace(/\bprodct\b|\bprduct\b|\bproduc\b/g, "product");

  return text;
}

/**
 * Deep semantic intent classifier for Aura Skincare customer inquiries.
 * Covers 1,000+ distinct customer question phrasings across 48 core intents.
 */
export function classifyIntent(
  query: string,
  conversationContext?: { activeOrderId?: string | null; awaitingConfirmation?: boolean }
): IntentClassificationResult {
  const norm = normalizeTranscription(query);

  const isHinglish = /\b(kahan|kaha|kab|kya|hai|haan|ji|bhai|mera|meri|nahi|nahin|aaya|aayega|kar do|kardo|karo|batao|shukriya|theek|accha|kaunsa|konsa|ye|yeh|chahiye|wala|paise|kitne|kitna|hogi|kaun|saman|pata)\b/i.test(
    norm
  );

  const secondaryIntents: DetectedIntent[] = [];

  // Multi-intent detection: (e.g. "Where is ORD-101 and can I cancel it?")
  if (/\b(and can i cancel|and cancel it|aur cancel|can i also cancel)\b/i.test(norm)) {
    secondaryIntents.push("CANCELLATION_ELIGIBILITY");
  }
  if (/\b(how much did i pay|what was the price|amount kitna)\b/i.test(norm)) {
    secondaryIntents.push("ORDER_AMOUNT");
  }

  // 1. OUT OF SCOPE (Flights, booking, movies, weather, cricket, politics, math, etc.)
  if (
    /\b(flight|airline|ticket|hotel|book a|goa|mumbai|delhi|weather|rain|temperature|forecast|movie|cinema|actor|cricket|ipl|football|homework|math|write code|politics|election|train|bus ticket|pizza|burger|taxi|cab|uber)\b/i.test(
      norm
    )
  ) {
    return { intent: "OUT_OF_SCOPE", confidence: 0.96, isHinglish, normalizedQuery: norm, secondaryIntents };
  }

  // 2. HUMAN AGENT / ESCALATION REQUEST
  if (
    /\b(human|real person|talk to someone|connect me to an agent|talk to an agent|customer support agent|representative|executive|supervisor|manager|escalat(e|ion)|someone else|customer care person|insan se baat)\b/i.test(
      norm
    )
  ) {
    if (/\b(escalat|higher level|senior|complaint department)\b/i.test(norm)) {
      return { intent: "ESCALATION_REQUEST", confidence: 0.95, isHinglish, normalizedQuery: norm, secondaryIntents };
    }
    return { intent: "HUMAN_AGENT_REQUEST", confidence: 0.95, isHinglish, normalizedQuery: norm, secondaryIntents };
  }

  // 3. COMPLAINTS & FRUSTRATION
  if (
    /\b(frustrat(ing|ed)|angry|ridiculous|unacceptable|bad service|horrible|worst service|disappointed|cheat|scam|pathetic|very bad|bekaar|bakwas|gussa)\b/i.test(
      norm
    )
  ) {
    return { intent: "COMPLAINT", confidence: 0.93, isHinglish, normalizedQuery: norm, secondaryIntents };
  }

  // 4. CONFIRMATION & DECLINE
  if (conversationContext?.awaitingConfirmation) {
    if (/\b(no|nope|don't|dont|stop|nahi|nahin|cancel mat|mat karo|rehne do|keep it)\b/i.test(norm)) {
      return { intent: "DECLINE_ACTION", confidence: 0.99, isHinglish, normalizedQuery: norm, secondaryIntents };
    }
    if (/\b(yes|yeah|yep|yup|sure|proceed|confirm|cancel|haan|kardo|kar do|please|go ahead|do it)\b/i.test(norm)) {
      return { intent: "CONFIRM_ACTION", confidence: 0.99, isHinglish, normalizedQuery: norm, secondaryIntents };
    }
  }

  if (/^(yes|yeah|yep|yup|sure|proceed|confirm|haan|haanji|haan ji)\b/i.test(norm)) {
    return { intent: "CONFIRM_ACTION", confidence: 0.98, isHinglish, normalizedQuery: norm, secondaryIntents };
  }
  if (/^(no|nope|nahi|nahin|don't|dont|stop)\b/i.test(norm)) {
    return { intent: "DECLINE_ACTION", confidence: 0.98, isHinglish, normalizedQuery: norm, secondaryIntents };
  }

  // 5. REPETITION & REPHRASING REQUESTS
  if (
    /\b(repeat|say that again|say again|come again|what did you say|repeat that|phir se bolo|dubara bolo|pardon)\b/i.test(
      norm
    )
  ) {
    return { intent: "REPETITION_REQUEST", confidence: 0.95, isHinglish, normalizedQuery: norm, secondaryIntents };
  }
  if (
    /\b(rephrase|explain simply|didn't understand|simple words|explain differently|samajh nahi aaya)\b/i.test(
      norm
    )
  ) {
    return { intent: "REPHRASING_REQUEST", confidence: 0.92, isHinglish, normalizedQuery: norm, secondaryIntents };
  }

  // 6. GREETINGS & CASUAL INTERACTION
  if (/^(hi|hello|hey|hey there|good morning|good afternoon|good evening|namaste|namaskar|hello aria|hi aria|are you there|can you hear me)\??$/i.test(norm)) {
    return { intent: "GREETING", confidence: 0.96, isHinglish, normalizedQuery: norm, secondaryIntents };
  }

  // 7. THANKS & GOODBYE — detect from anywhere in the sentence, not just exact matches
  const isThanks =
    /\b(thank you|thanks|shukriya|dhanyawad|dhanyawaad|bahut shukriya|bahut dhanyawad|aapka shukriya)\b/i.test(norm) ||
    /^(perfect|great|awesome|amazing|that'?s (great|perfect|all|helpful|it)|you'?ve been (very |really |so )?(helpful|great)|i('?m| am) (good|sorted|all set) now|that covers it|no more questions|nothing else)$/i.test(norm) ||
    /\b(that('?s| is) (all|it|everything)|no (more )?questions?|nothing else|i'm (good|fine|set|sorted) (now|thanks)?|you('?ve| have) been (very |really |so )?(helpful|great|wonderful))\b/i.test(norm);

  const isGoodbye =
    /\b(bye|goodbye|bye[\s-]bye|tata|alvida|see you|take care|have a (good|great|nice|lovely) (day|one|evening|night)|ciao|cheerio|farewell)\b/i.test(norm) ||
    /^(i('?ll| will) go now|that'?s all|nothing else|i don't need anything else|all good|i'?m good now|all done)$/i.test(norm);

  if (isThanks && !isGoodbye) {
    return { intent: "THANKS", confidence: 0.95, isHinglish, normalizedQuery: norm, secondaryIntents };
  }
  if (isGoodbye) {
    return { intent: "GOODBYE", confidence: 0.95, isHinglish, normalizedQuery: norm, secondaryIntents };
  }
  if (isThanks) {
    return { intent: "THANKS", confidence: 0.95, isHinglish, normalizedQuery: norm, secondaryIntents };
  }

  // 8. RETURNED ORDER LOOKUP
  const isReturnedOrderLookup =
    /\b(which order (did i|have i|i) return|tell me (the |my )?return(ed)? order|order which i (have )?return|say me the order|which product did i send back|what order did i send back|show me my returned order|my returned order|which order was returned|return wala order|kaunsa order return kiya|konsa order return kiya|what i returned|check what i returned|which one i returned|returned order)\b/i.test(
      norm
    ) ||
    (/\b(returned|send back|sent back)\b/i.test(norm) && /\b(which|what|tell me|show me|kaunsa|konsa)\b/i.test(norm));

  if (isReturnedOrderLookup) {
    return { intent: "RETURNED_ORDER_LOOKUP", confidence: 0.95, isHinglish, normalizedQuery: norm, secondaryIntents };
  }

  // 9. DAMAGED / DEFECTIVE / WRONG / MISSING PRODUCT
  if (/\b(wrong product|wrong item|different product|received wrong|galat product)\b/i.test(norm)) {
    return { intent: "WRONG_PRODUCT", confidence: 0.94, isHinglish, normalizedQuery: norm, secondaryIntents };
  }
  if (/\b(missing product|missing item|item missing|something missing|kuch missing)\b/i.test(norm)) {
    return { intent: "MISSING_PRODUCT", confidence: 0.94, isHinglish, normalizedQuery: norm, secondaryIntents };
  }
  if (/\b(damaged|broken|leaked|cracked|spilled|photo|photos|bottle broken|tuta|phuta)\b/i.test(norm)) {
    return { intent: "DAMAGED_PRODUCT", confidence: 0.94, isHinglish, normalizedQuery: norm, secondaryIntents };
  }
  if (/\b(defective|faulty|not working|pump not working|kharab)\b/i.test(norm)) {
    return { intent: "DEFECTIVE_PRODUCT", confidence: 0.94, isHinglish, normalizedQuery: norm, secondaryIntents };
  }

  // 10. REFUND / MONEY BACK
  if (/\b(money back|refund|reimbursement|paise wapas|paisa wapas|get my money)\b/i.test(norm)) {
    return { intent: "REFUND", confidence: 0.94, isHinglish, normalizedQuery: norm, secondaryIntents };
  }

  // 11. REFUSING DELIVERY
  if (/\b(refuse delivery|refuse the delivery|reject delivery|doorstep refusal|mana kar doon|mana kar sakta)\b/i.test(norm)) {
    return { intent: "REFUSING_DELIVERY", confidence: 0.95, isHinglish, normalizedQuery: norm, secondaryIntents };
  }

  // 12. RETURN WINDOW & CONDITIONS
  if (/\b(how many days (do i have )?to return|return window|how long do i have to return|kitne din mein return)\b/i.test(norm)) {
    return { intent: "RETURN_WINDOW", confidence: 0.94, isHinglish, normalizedQuery: norm, secondaryIntents };
  }
  if (/\b(opened product|used product|return if i opened|return if i used|original box|original packaging|seal is broken|unopened|unsealed|condition should the product be in)\b/i.test(norm)) {
    return { intent: "RETURN_CONDITIONS", confidence: 0.94, isHinglish, normalizedQuery: norm, secondaryIntents };
  }

  // 13. GENERAL RETURN POLICY
  if (
    /^(what is (your|the) return policy|tell me (your|the) return policy|return policy|how do returns work|what are the return rules|return policy kya hai)\??$/i.test(
      norm
    )
  ) {
    return { intent: "RETURN_POLICY", confidence: 0.95, isHinglish, normalizedQuery: norm, secondaryIntents };
  }

  // 14. RETURN ELIGIBILITY & RETURN REQUEST
  const isReturn =
    /\b(can i return|eligible for return|send this back|send it back|return it|give it back|want to give it back|return my|return product|return this|return ho sakta hai|wapas ho sakta|want to return|i want to return)\b/i.test(
      norm
    );
  if (isReturn) {
    if (/\b(i want to return|want to return|start a return|process return|return karna hai)\b/i.test(norm)) {
      return { intent: "RETURN_REQUEST", confidence: 0.93, isHinglish, normalizedQuery: norm, secondaryIntents };
    }
    return { intent: "RETURN_ELIGIBILITY", confidence: 0.93, isHinglish, normalizedQuery: norm, secondaryIntents };
  }

  // 15. CANCELLATION & CANCELLATION ELIGIBILITY
  const isCancel = /\b(cancel|cancellation|stop the order|don't want it anymore|cancel kar do|cancel kardo|cancel it|stop delivery|stop the package|changed my mind)\b/i.test(
    norm
  );
  if (isCancel) {
    if (/\b(can i|can you|can this|eligible|is it possible|possible to|am i allowed|sakta hai|too late to cancel|can i still cancel|can i cancel after)\b/i.test(norm)) {
      return { intent: "CANCELLATION_ELIGIBILITY", confidence: 0.94, isHinglish, normalizedQuery: norm, secondaryIntents };
    }
    return { intent: "CANCELLATION", confidence: 0.95, isHinglish, normalizedQuery: norm, secondaryIntents };
  }

  // 16. ORDER ID PROVIDED DIRECTLY
  const idOnlyPattern = /^(ord[- ]?)?(\d{3})\.?$/i;
  const directIdProvided = /^(my order is|it is|order id is|order is)?\s*(ord[- ]?)?(\d{3})\.?$/i;
  if (idOnlyPattern.test(norm) || directIdProvided.test(norm)) {
    return { intent: "ORDER_ID_PROVIDED", confidence: 0.98, isHinglish, normalizedQuery: norm, secondaryIntents };
  }

  // 17. DELIVERY ADDRESS
  if (
    /\b(delivery address|shipping address|what is (?:my |the )?address|which address|where will .* be delivered|where is .* delivered|where will .* deliver|kis address|address kya hai|address batayein|kahan deliver hoga|kaha deliver hoga|pincode|what city)\b/i.test(
      norm
    )
  ) {
    return { intent: "DELIVERY_ADDRESS", confidence: 0.95, isHinglish, normalizedQuery: norm, secondaryIntents };
  }

  // 18. PAYMENT INFORMATION
  if (
    /\b(how did i pay|payment method|payment mode|is it cod or prepaid|payment status|did i pay online|paid by what|payment kaise kiya|payment information)\b/i.test(
      norm
    )
  ) {
    return { intent: "PAYMENT_INFORMATION", confidence: 0.95, isHinglish, normalizedQuery: norm, secondaryIntents };
  }

  // 19. ORDER ID MISSING / UNKNOWN
  if (
    /\b(don't know|forgot|lost|do not have|yaad nahi|pata nahi)\b/i.test(norm) &&
    /\b(order|id|number)\b/i.test(norm)
  ) {
    return { intent: "ORDER_ID_MISSING", confidence: 0.94, isHinglish, normalizedQuery: norm, secondaryIntents };
  }

  // 20. ORDER LOOKUP ("the order I bought yesterday", "the order I placed", "my recent order")
  if (/\b(the order i (bought|ordered|placed)|recent order|last order)\b/i.test(norm)) {
    return { intent: "ORDER_LOOKUP", confidence: 0.94, isHinglish, normalizedQuery: norm, secondaryIntents };
  }

  // 21. COURIER INFORMATION & TRACKING NUMBER
  if (/\b(tracking number|tracking id|shipment number|bluedart number|delhivery tracking)\b/i.test(norm)) {
    return { intent: "TRACKING_NUMBER", confidence: 0.95, isHinglish, normalizedQuery: norm, secondaryIntents };
  }
  if (/\b(courier|who is delivering|delivery company|who has my package|courier kaun hai|delivery partner)\b/i.test(norm)) {
    return { intent: "COURIER_INFORMATION", confidence: 0.95, isHinglish, normalizedQuery: norm, secondaryIntents };
  }

  // 22. DELIVERY ETA & TIME
  if (
    /\b(how long does delivery take|how many days for delivery|how fast do you deliver|delivery time|delivery kitne din|how many business days|shipping take)\b/i.test(
      norm
    ) && !/\b(my|package|parcel|ord-)\b/i.test(norm)
  ) {
    return { intent: "DELIVERY_TIME", confidence: 0.93, isHinglish, normalizedQuery: norm, secondaryIntents };
  }

  if (
    /\b(when is my order coming|when will i get|when will my package arrive|when can i expect|is it coming today|is my package coming today|will i receive it today|eta|delivery eta|how much longer|when will it reach|when will it arrive|kab (?:tak )?a*yega|kab (?:tak )?pahunchega|order kab)\b/i.test(
      norm
    )
  ) {
    return { intent: "DELIVERY_ETA", confidence: 0.94, isHinglish, normalizedQuery: norm, secondaryIntents };
  }

  // 23. DELIVERY DELAY & LOCATION
  if (/\b(late|delay|delayed|waiting|not arrived|order not came|abhi tak nahi aaya|kaha reh gaya)\b/i.test(norm)) {
    return { intent: "DELIVERY_DELAY", confidence: 0.93, isHinglish, normalizedQuery: norm, secondaryIntents };
  }
  if (/\b(where is my parcel right now|where is the delivery|where is it right now|is it close|near me|package abhi kaha hai)\b/i.test(norm)) {
    return { intent: "DELIVERY_LOCATION", confidence: 0.92, isHinglish, normalizedQuery: norm, secondaryIntents };
  }

  // 24. COD / CASH ON DELIVERY
  if (/\b(cod|cash on delivery|pay cash|cash pay|doorstep pay|upi for cod|pay by upi when delivered|cod limit|maximum cod amount)\b/i.test(norm)) {
    return { intent: "COD", confidence: 0.95, isHinglish, normalizedQuery: norm, secondaryIntents };
  }

  // 25. SHIPPING FEE & FREE SHIPPING
  if (/\b(free shipping|free delivery|when is shipping free|minimum order for free delivery|spend for free shipping|free delivery kab)\b/i.test(norm)) {
    return { intent: "FREE_SHIPPING", confidence: 0.95, isHinglish, normalizedQuery: norm, secondaryIntents };
  }
  if (/\b(shipping fee|delivery fee|delivery charge|how much is shipping|do you charge for delivery|delivery charge kitna)\b/i.test(norm)) {
    return { intent: "SHIPPING_FEE", confidence: 0.94, isHinglish, normalizedQuery: norm, secondaryIntents };
  }

  // 26. PRODUCT IN ORDER & ORDER AMOUNT
  if (/\b(what did i order|what product is in my order|what's in ord-|what did i buy|which product did i purchase|which skincare product|what is in my order|what items|items in my order|inside the package|kya items hai|products kya hai|order contents|what items are in)\b/i.test(norm)) {
    return { intent: "PRODUCT_IN_ORDER", confidence: 0.94, isHinglish, normalizedQuery: norm, secondaryIntents };
  }
  if (/\b(how much did i pay|order amount|what was my order amount|price of my order|kitna pay kiya)\b/i.test(norm)) {
    return { intent: "ORDER_AMOUNT", confidence: 0.94, isHinglish, normalizedQuery: norm, secondaryIntents };
  }

  // 27. ORDER DETAILS & CONFIRMATION
  if (/\b(order details|tell me about my order|check my order details|full details of my order)\b/i.test(norm)) {
    return { intent: "ORDER_DETAILS", confidence: 0.92, isHinglish, normalizedQuery: norm, secondaryIntents };
  }
  if (/\b(has my order shipped|did my order ship|is it dispatched|did you send my order|shipped ho gaya)\b/i.test(norm)) {
    return { intent: "ORDER_CONFIRMATION", confidence: 0.92, isHinglish, normalizedQuery: norm, secondaryIntents };
  }

  // 28. GENERAL ORDER TRACKING & ORDER STATUS
  const isTracking =
    /\b(where is my order|where's my order|where's my package|where is my package|check my order|check my package|track my order|track this order|what's happening with my order|what is the status|what's my order status|tell me my order status|is my order on the way|is my parcel on the way|locate my package|find my order|look up my order|please check my order|update on my order|mera order kaha hai|track my shipment|kaha hai|where my order)\b/i.test(
      norm
    );
  if (isTracking) {
    if (/\b(track|tracking)\b/i.test(norm)) {
      return { intent: "ORDER_TRACKING", confidence: 0.93, isHinglish, normalizedQuery: norm, secondaryIntents };
    }
    return { intent: "ORDER_STATUS", confidence: 0.94, isHinglish, normalizedQuery: norm, secondaryIntents };
  }

  // 29. GENERAL AURA INFO & PRODUCT SUPPORT
  if (/\b(what is aura|about aura|what does aura skincare sell|are you a skincare brand|what kind of brand|tell me about aura)\b/i.test(norm)) {
    return { intent: "GENERAL_AURA_INFO", confidence: 0.93, isHinglish, normalizedQuery: norm, secondaryIntents };
  }
  if (/\b(product support|skincare routine|which product for|recommend|sunscreen benefits|vitamin c benefits)\b/i.test(norm)) {
    return { intent: "PRODUCT_SUPPORT", confidence: 0.90, isHinglish, normalizedQuery: norm, secondaryIntents };
  }

  // 30. CONTEXT-BASED FALLBACK: If order in context, classify as follow-up
  if (conversationContext?.activeOrderId) {
    if (/\b(what about|how about|and that|it|that one|this one)\b/i.test(norm)) {
      return { intent: "FOLLOW_UP_QUESTION", confidence: 0.85, isHinglish, normalizedQuery: norm, secondaryIntents };
    }
    return { intent: "ORDER_STATUS", confidence: 0.80, isHinglish, normalizedQuery: norm, secondaryIntents };
  }

  // 31. UNCLEAR / UNKNOWN
  return { intent: "UNKNOWN", confidence: 0.50, isHinglish, normalizedQuery: norm, secondaryIntents };
}
