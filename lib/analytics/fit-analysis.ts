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
  responseTimeMs: number,
  timestamp = new Date().toISOString()
): Record<string, string | number> {
  const targetSummary = result.metadata?.targetSummary;

  return {
    timestamp,
    input_method: inputMethod,
    ...(inputMethod === "url" && submittedUrl.trim() ? { submitted_url: submittedUrl.trim() } : {}),
    company: targetSummary?.companyName ?? "",
    role: targetSummary?.roleTitle ?? "",
    fit_verdict: extractFitVerdict(result),
    response_time_ms: responseTimeMs,
    response_time_bucket: bucketFitResponseTime(responseTimeMs)
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

function bucketFitResponseTime(durationMs: number) {
  if (durationMs < 3_000) {
    return "under_3s";
  }

  if (durationMs < 8_000) {
    return "3s_to_8s";
  }

  if (durationMs < 15_000) {
    return "8s_to_15s";
  }

  return "15s_plus";
}
