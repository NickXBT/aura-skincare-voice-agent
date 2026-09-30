import { NextRequest, NextResponse } from "next/server";
import { getAgentReply, Message } from "@/lib/agent/chat-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, apiKey } = body as {
      messages: Message[];
      apiKey?: string;
    };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request: messages array is required." },
        { status: 400 }
      );
    }

    const response = await getAgentReply(messages, apiKey);
    return NextResponse.json(response);
  } catch (err: any) {
    console.error("API /api/agent/chat error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error occurred." },
      { status: 500 }
    );
  }
}
