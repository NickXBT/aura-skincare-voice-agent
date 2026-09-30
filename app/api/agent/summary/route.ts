import { NextRequest, NextResponse } from "next/server";
import { generateCallSummary } from "@/lib/agent/call-summary";
import { Message } from "@/lib/agent/chat-engine";
import { ToolCallResult } from "@/lib/tools/order-tool";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, toolCalls } = body as {
      messages: Message[];
      toolCalls?: ToolCallResult[];
    };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request: messages array is required." },
        { status: 400 }
      );
    }

    const summaryReport = generateCallSummary(messages, toolCalls || []);
    return NextResponse.json(summaryReport);
  } catch (err: any) {
    console.error("API /api/agent/summary error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error occurred." },
      { status: 500 }
    );
  }
}
