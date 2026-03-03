import { NextResponse } from "next/server";
import { answerChat } from "@/lib/ai/chat-service";
import { logEvent } from "@/lib/logging/logger";
import type { ChatRequest } from "@/types/ai";

export async function POST(request: Request) {
  const payload = (await request.json()) as ChatRequest;
  const response = await answerChat(payload);
  logEvent("info", "chat_answered", { mode: payload.mode ?? "auto" });
  return NextResponse.json(response);
}
