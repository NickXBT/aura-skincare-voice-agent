import { NextRequest, NextResponse } from "next/server";
import { getAgentReply, Message } from "@/lib/agent/chat-engine";
import {
  applyClientCancelledOrders,
  getCancelledOrderIds,
  getAuditLog,
  getAllMockOrders,
  OrderAuditEvent,
} from "@/lib/orders/database";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, apiKey, cancelledOrderIds, auditEvents } = body as {
      messages: Message[];
      apiKey?: string;
      cancelledOrderIds?: string[];
      auditEvents?: OrderAuditEvent[];
    };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request: messages array is required." },
        { status: 400 }
      );
    }

    // Synchronize client-side persistent cancellations to ensure single source of truth across serverless instances
    if (cancelledOrderIds && Array.isArray(cancelledOrderIds)) {
      applyClientCancelledOrders(cancelledOrderIds, auditEvents);
    }

    const response = await getAgentReply(messages, apiKey);

    // Return current cancellation state, full audit log, and updated orders to client
    const currentCancelledIds = getCancelledOrderIds();
    const auditLog = getAuditLog();
    const updatedOrders = getAllMockOrders();

    return NextResponse.json({
      ...response,
      cancelledOrderIds: currentCancelledIds,
      auditLog,
      updatedOrders,
    });
  } catch (err: any) {
    console.error("API /api/agent/chat error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error occurred." },
      { status: 500 }
    );
  }
}
