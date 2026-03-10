import type { FitAnalysisService } from "@/types/contracts";
import type { FitPresentationMode, RoleInput } from "@/types/ai";
import { staticRetrievalStore } from "@/lib/retrieval/store";
import { generateFitAnalysisWithOpenAI } from "@/lib/ai/openai";
import { llmRequirementExtractionService } from "@/lib/ai/requirement-extraction";

function roleInputToText(input: RoleInput): string {
  if (input.kind === "text") {
    return input.text;
  }
  if (input.kind === "url") {
    return input.url;
  }
  return `${input.fileId} ${input.mimeType}`;
}

export const heuristicFitAnalysisService: FitAnalysisService = {
  async analyze(roleInput, _sessionId, presentationMode = "recruiter_brief") {
    const roleText = roleInputToText(roleInput);
    const requirements = await llmRequirementExtractionService.extract(roleText);
    const evidence = await staticRetrievalStore.searchEvidence(roleText, "fit_analysis");
    return generateFitAnalysisWithOpenAI(roleText, requirements, evidence, roleInput.kind, presentationMode);
  }
};
