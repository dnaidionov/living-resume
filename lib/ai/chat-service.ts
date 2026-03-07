import type { ChatRequest } from "@/types/ai";
import { staticRetrievalStore } from "@/lib/retrieval/store";
import { OpenAIChatModel } from "@/lib/ai/openai";

const model = new OpenAIChatModel();

function resolveMode(request: ChatRequest): "resume_qa" | "build_process" {
  if (request.mode === "build_process") {
    return "build_process";
  }

  if (request.mode === "resume_qa") {
    return "resume_qa";
  }

  const normalized = request.message.toLowerCase();
  return normalized.includes("build") || normalized.includes("site") || normalized.includes("architecture")
    ? "build_process"
    : "resume_qa";
}

export async function answerChat(request: ChatRequest) {
  const mode = resolveMode(request);
  const evidence = await staticRetrievalStore.searchEvidence(
    request.message,
    mode === "build_process" ? "build_process" : "resume_qa"
  );

  return model.generateAnswer({
    prompt: request.message,
    evidence,
    mode,
    history: request.history?.slice(-8)
  });
}
