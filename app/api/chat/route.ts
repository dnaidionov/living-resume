import { NextResponse } from "next/server";
import { answerChat } from "@/lib/ai/chat-service";
import { logEvent } from "@/lib/logging/logger";
import type { ChatRequest } from "@/types/ai";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ChatRequest;
    const response = await answerChat(payload);
    logEvent("info", "chat_answered", { mode: payload.mode ?? "auto" });
    return NextResponse.json(response);
  } catch (error) {
    logEvent("error", "chat_failed", {
      error: error instanceof Error ? error.message : "Unknown chat error"
    });

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to answer chat request."
      },
      { status: 500 }
    );
  }
}
