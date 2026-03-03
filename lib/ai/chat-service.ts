import type { ChatRequest } from "@/types/ai";
import { staticRetrievalStore } from "@/lib/retrieval/store";
import { OpenAIChatModel } from "@/lib/ai/openai";

const model = new OpenAIChatModel();

export async function answerChat(request: ChatRequest) {
  const mode = request.mode === "build_process" ? "build_process" : "resume_qa";
  const evidence = await staticRetrievalStore.searchEvidence(
    request.message,
    mode === "build_process" ? "build_process" : "resume_qa"
  );

  return model.generateAnswer({
    prompt: request.message,
    evidence,
    mode
  });
}
