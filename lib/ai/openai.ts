import type { ChatModel } from "@/types/contracts";
import type { ExtractedRoleRequirement, FitAnalysisResult, FitPresentationMode, ModelInput, ModelOutput } from "@/types/ai";
import type { EvidenceChunk } from "@/types/content";
import {
  assembleFitAnalysisResult,
  buildChatSystemPrompt,
  buildChatUserPrompt,
  buildFallbackChatAnswer,
  buildFallbackFitAnalysisResponse,
  buildFitAnalysisSystemPrompt,
  buildFitAnalysisUserPrompt,
  buildCitations,
  finalizeChatAnswer
} from "@/lib/ai/prompting";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings";
const defaultChatModel = process.env.OPENAI_CHAT_MODEL ?? "gpt-5-mini";
const defaultFitModel = process.env.OPENAI_FIT_MODEL ?? process.env.OPENAI_CHAT_MODEL ?? "gpt-5-mini";
const defaultEmbeddingModel = process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";
type TargetSummary = NonNullable<FitAnalysisResult["metadata"]>["targetSummary"];

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

type EmbeddingsResponse = {
  data?: Array<{
    embedding?: number[];
    index?: number;
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
      answer:
        finalizeChatAnswer(answer.trim(), input.mode) ||
        buildFallbackChatAnswer(input.prompt, input.evidence, input.mode),
      citations: buildCitations(input.evidence),
      confidence: input.evidence.length >= 4 ? "high" : input.evidence.length >= 2 ? "medium" : "low"
    };
  }
}

export async function generateFitAnalysisWithOpenAI(
  roleText: string,
  requirements: ExtractedRoleRequirement[],
  evidence: EvidenceChunk[],
  inputKind: "text" | "url" | "file",
  presentationMode: FitPresentationMode,
  targetSummary?: TargetSummary
): Promise<FitAnalysisResult> {
  if (!process.env.OPENAI_API_KEY) {
    return buildFallbackFitAnalysisResponse(roleText, requirements, evidence, inputKind, presentationMode, targetSummary);
  }

  try {
    const response = await requestJsonCompletion<Record<string, unknown>>({
      model: defaultFitModel,
      systemPrompt: buildFitAnalysisSystemPrompt(),
      userPrompt: buildFitAnalysisUserPrompt(roleText, requirements, evidence, presentationMode)
    });

    return assembleFitAnalysisResult({
      input: response as Partial<FitAnalysisResult>,
      requirements,
      evidence,
      inputKind,
      presentationMode,
      targetSummary,
      evaluatorVersion: "v5-llm-fit-analysis",
      stageVersions: {
        requirementExtraction: "v1-llm-primary",
        retrieval: "v1-semantic-static",
        generation: "v3-llm-internal-deterministic-brief"
      }
    });
  } catch {
    return buildFallbackFitAnalysisResponse(roleText, requirements, evidence, inputKind, presentationMode, targetSummary);
  }
}

type CompletionRequest = {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  history?: ModelInput["history"];
};

export async function requestJsonCompletion<T>(request: CompletionRequest): Promise<T> {
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

export async function requestEmbeddings(inputs: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await fetch(OPENAI_EMBEDDINGS_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: defaultEmbeddingModel,
      input: inputs
    })
  });

  const payload = (await response.json()) as EmbeddingsResponse;
  if (!response.ok) {
    throw new Error(payload.error?.message ?? "OpenAI embeddings request failed.");
  }

  const vectors = (payload.data ?? [])
    .sort((left, right) => (left.index ?? 0) - (right.index ?? 0))
    .map((item) => item.embedding ?? []);

  if (vectors.length !== inputs.length || vectors.some((vector) => vector.length === 0)) {
    throw new Error("OpenAI embeddings response was incomplete.");
  }

  return vectors;
}
