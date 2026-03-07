import type { ChatModel } from "@/types/contracts";
import type { FitAnalysisResult, ModelInput, ModelOutput } from "@/types/ai";
import type { EvidenceChunk } from "@/types/content";
import {
  buildChatSystemPrompt,
  buildChatUserPrompt,
  buildFallbackChatAnswer,
  buildFallbackFitAnalysisSummary,
  buildFitAnalysisSystemPrompt,
  buildFitAnalysisUserPrompt,
  buildCitations,
  normalizeFitAnalysisResult
} from "@/lib/ai/prompting";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const defaultChatModel = process.env.OPENAI_CHAT_MODEL ?? "gpt-5-mini";
const defaultFitModel = process.env.OPENAI_FIT_MODEL ?? process.env.OPENAI_CHAT_MODEL ?? "gpt-5-mini";

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

export class OpenAIChatModel implements ChatModel {
  async generateAnswer(input: ModelInput): Promise<ModelOutput> {
    if (!process.env.OPENAI_API_KEY) {
      return {
        answer: buildFallbackChatAnswer(input.prompt, input.evidence, input.mode),
        citations: buildCitations(input.evidence),
        confidence: input.evidence.length >= 4 ? "high" : input.evidence.length >= 2 ? "medium" : "low"
      };
    }

    const answer = await requestTextCompletion({
      model: defaultChatModel,
      systemPrompt: buildChatSystemPrompt(input.mode),
      userPrompt: buildChatUserPrompt(input.prompt, input.evidence),
      history: input.history
    });

    return {
      answer: answer.trim() || buildFallbackChatAnswer(input.prompt, input.evidence, input.mode),
      citations: buildCitations(input.evidence),
      confidence: input.evidence.length >= 4 ? "high" : input.evidence.length >= 2 ? "medium" : "low"
    };
  }
}

export async function generateFitAnalysisWithOpenAI(
  roleText: string,
  evidence: EvidenceChunk[],
  inputKind: "text" | "url" | "file"
): Promise<FitAnalysisResult> {
  if (!process.env.OPENAI_API_KEY) {
    const fallback = buildFallbackFitAnalysisSummary(roleText, evidence);
    return {
      ...fallback,
      metadata: {
        evaluatorVersion: "v2-fallback",
        inputKind
      }
    };
  }

  try {
    const response = await requestJsonCompletion<Partial<FitAnalysisResult>>({
      model: defaultFitModel,
      systemPrompt: buildFitAnalysisSystemPrompt(),
      userPrompt: buildFitAnalysisUserPrompt(roleText, evidence)
    });

    return normalizeFitAnalysisResult(response, evidence, inputKind);
  } catch {
    const fallback = buildFallbackFitAnalysisSummary(roleText, evidence);
    return {
      ...fallback,
      metadata: {
        evaluatorVersion: "v2-fallback-on-error",
        inputKind
      }
    };
  }
}

type CompletionRequest = {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  history?: ModelInput["history"];
};

async function requestJsonCompletion<T>(request: CompletionRequest): Promise<T> {
  const text = await requestCompletion({
    ...request,
    responseFormat: { type: "json_object" }
  });

  return JSON.parse(text) as T;
}

async function requestTextCompletion(request: CompletionRequest): Promise<string> {
  return requestCompletion(request);
}

async function requestCompletion(
  request: CompletionRequest & {
    responseFormat?: { type: "json_object" };
  }
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: request.model,
      messages: [
        {
          role: "system",
          content: request.systemPrompt
        },
        ...(request.history ?? []).map((item) => ({
          role: item.role,
          content: item.text
        })),
        {
          role: "user",
          content: request.userPrompt
        }
      ],
      response_format: request.responseFormat
    })
  });

  const payload = (await response.json()) as ChatCompletionResponse;
  if (!response.ok) {
    throw new Error(payload.error?.message ?? "OpenAI request failed.");
  }

  const content = payload.choices?.[0]?.message?.content;
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    const text = content
      .filter((item) => item.type === "text" && item.text)
      .map((item) => item.text)
      .join("\n")
      .trim();

    if (text) {
      return text;
    }
  }

  throw new Error("OpenAI response did not include content.");
}
