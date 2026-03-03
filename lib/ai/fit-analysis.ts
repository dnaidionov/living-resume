import type { FitAnalysisService } from "@/types/contracts";
import type { RoleInput } from "@/types/ai";
import { staticRetrievalStore } from "@/lib/retrieval/store";
import { buildFitAnalysisSummary } from "@/lib/ai/prompting";

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
  async analyze(roleInput) {
    const roleText = roleInputToText(roleInput);
    const evidence = await staticRetrievalStore.searchEvidence(roleText, "fit_analysis");
    return buildFitAnalysisSummary(roleText, evidence);
  }
};
