import type { FitAnalysisResult, FitVerdict } from "@/types/ai";

type FitAnalysisInputMethod = "text" | "url" | "file";

export function buildFitAnalysisStartedEventDetail(
  inputMethod: FitAnalysisInputMethod,
  submittedUrl: string,
  timestamp = new Date().toISOString()
): Record<string, string> {
  return {
    timestamp,
    input_method: inputMethod,
    ...(inputMethod === "url" && submittedUrl.trim() ? { submitted_url: submittedUrl.trim() } : {})
  };
}

export function buildFitAnalysisCompletedEventDetail(
  inputMethod: FitAnalysisInputMethod,
  submittedUrl: string,
  result: FitAnalysisResult,
  timestamp = new Date().toISOString()
): Record<string, string> {
  const targetSummary = result.metadata?.targetSummary;

  return {
    timestamp,
    input_method: inputMethod,
    ...(inputMethod === "url" && submittedUrl.trim() ? { submitted_url: submittedUrl.trim() } : {}),
    company: targetSummary?.companyName ?? "",
    role: targetSummary?.roleTitle ?? "",
    fit_verdict: extractFitVerdict(result)
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
