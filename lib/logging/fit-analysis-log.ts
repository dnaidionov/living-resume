import type { FitAnalysisResult, FitVerdict, RoleInput } from "@/types/ai";

export function buildFitAnalysisLogContext(
  roleInput: RoleInput,
  result: FitAnalysisResult,
  presentationMode: string
): Record<string, string> {
  const targetSummary = result.metadata?.targetSummary;

  return {
    url: roleInput.kind === "url" ? roleInput.url : "",
    roleName: targetSummary?.roleTitle ?? "",
    company: targetSummary?.companyName ?? "",
    fitVerdict: extractFitVerdict(result),
    inputKind: roleInput.kind,
    presentationMode
  };
}

function extractFitVerdict(result: FitAnalysisResult): FitVerdict {
  if (result.presentation.mode === "recruiter_brief") {
    return result.presentation.overallMatch.verdict;
  }

  return deriveVerdictFromInternalScore(result.internal.overallScore);
}

function deriveVerdictFromInternalScore(score: number): FitVerdict {
  if (score >= 8) {
    return "strong_fit_lets_talk";
  }

  if (score >= 5) {
    return "probably_a_good_fit";
  }

  return "probably_not_your_person";
}
