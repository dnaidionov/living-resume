import type { ChatModel } from "@/types/contracts";
import type { ExtractedRoleRequirement, FitAnalysisResult, FitPresentationMode, ModelInput, ModelOutput } from "@/types/ai";
import type { EvidenceChunk } from "@/types/content";
import type { ProviderTask } from "@/lib/ai/provider-config";
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
import { hasProviderConfig, resolveProviderConfig } from "@/lib/ai/provider-config";
import { createOpenAICompatibleProvider } from "@/lib/ai/providers/openai-compatible";
type TargetSummary = NonNullable<FitAnalysisResult["metadata"]>["targetSummary"];
const openAICompatibleProvider = createOpenAICompatibleProvider();

export class OpenAIChatModel implements ChatModel {
  async generateAnswer(input: ModelInput): Promise<ModelOutput> {
    if (!hasProviderConfig("chat")) {
      return {
        answer: buildFallbackChatAnswer(input.prompt, input.evidence, input.mode),
        citations: buildCitations(input.evidence),
        confidence: input.evidence.length >= 4 ? "high" : input.evidence.length >= 2 ? "medium" : "low"
      };
    }

    const answer = await requestTextCompletion({
      systemPrompt: buildChatSystemPrompt(input.mode),
      userPrompt: buildChatUserPrompt(input.prompt, input.evidence),
      history: input.history
    }, "chat");

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
  if (!hasProviderConfig("fit")) {
    return buildFallbackFitAnalysisResponse(roleText, requirements, evidence, inputKind, presentationMode, targetSummary);
  }

  try {
    const response = await requestJsonCompletion<Record<string, unknown>>({
      systemPrompt: buildFitAnalysisSystemPrompt(),
      userPrompt: buildFitAnalysisUserPrompt(roleText, requirements, evidence, presentationMode)
    }, "fit");

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
  model?: string;
  systemPrompt: string;
  userPrompt: string;
  history?: ModelInput["history"];
};

export async function requestJsonCompletion<T>(
  request: CompletionRequest,
  task: ProviderTask = "fit"
): Promise<T> {
  const config = resolveProviderConfig(task);
  const resolvedConfig = request.model ? { ...config, model: request.model } : config;
  switch (config.compatibility) {
    case "openai":
      return openAICompatibleProvider.generateJson<T>(resolvedConfig, {
        systemPrompt: request.systemPrompt,
        userPrompt: request.userPrompt,
        history: request.history
      });
  }
}

async function requestTextCompletion(
  request: CompletionRequest,
  task: ProviderTask = "chat"
): Promise<string> {
  const config = resolveProviderConfig(task);
  const resolvedConfig = request.model ? { ...config, model: request.model } : config;
  switch (config.compatibility) {
    case "openai":
      return openAICompatibleProvider.generateText(resolvedConfig, {
        systemPrompt: request.systemPrompt,
        userPrompt: request.userPrompt,
        history: request.history
      });
  }
}

export async function requestEmbeddings(inputs: string[]): Promise<number[][]> {
  const config = resolveProviderConfig("embeddings");
  switch (config.compatibility) {
    case "openai":
      return openAICompatibleProvider.embed(config, inputs);
  }
}
