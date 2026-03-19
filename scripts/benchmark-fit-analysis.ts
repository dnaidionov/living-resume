import { performance } from "node:perf_hooks";
import { loadLocalEnv } from "@/lib/env/load-local-env";
import { fetchJobPostingFromUrl } from "@/lib/platform/url-intake";
import { llmRequirementExtractionService } from "@/lib/ai/requirement-extraction";
import { heuristicFitAnalysisService, resolveFitAnalysisEvidence } from "@/lib/ai/fit-analysis";
import type { FitAnalysisResult, FitPresentationMode } from "@/types/ai";
import { hasProviderConfig, readProviderSummary } from "@/lib/ai/provider-config";

loadLocalEnv();

type BenchmarkResult = {
  label: string;
  durationMs: number;
  count?: number;
  verdict?: string;
};

function readPresentationVerdict(result: FitAnalysisResult): string {
  return result.presentation.mode === "recruiter_brief"
    ? result.presentation.overallMatch.label
    : result.presentation.overallSummary;
}

function parseArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

function parsePresentationMode(value: string | undefined): FitPresentationMode {
  return value === "scorecard" ? "scorecard" : "recruiter_brief";
}

async function time<T>(label: string, fn: () => Promise<T>): Promise<{ result: T; durationMs: number }> {
  const start = performance.now();
  const result = await fn();
  return {
    result,
    durationMs: performance.now() - start
  };
}

async function main() {
  const url = parseArg("--url");
  const presentationMode = parsePresentationMode(parseArg("--presentation-mode"));

  if (!url) {
    throw new Error("Missing required --url argument.");
  }

  const results: BenchmarkResult[] = [];

  const fetchFirst = await time("url_fetch_first", () => fetchJobPostingFromUrl(url, { useCache: false }));
  results.push({ label: "url_fetch_first", durationMs: fetchFirst.durationMs });

  const posting = fetchFirst.result;

  const fetchSecond = await time("url_fetch_second", () => fetchJobPostingFromUrl(url, { useCache: false }));
  results.push({ label: "url_fetch_second", durationMs: fetchSecond.durationMs });

  const requirementsFirst = await time("requirements_first", () => llmRequirementExtractionService.extract(posting.content));
  results.push({
    label: "requirements_first",
    durationMs: requirementsFirst.durationMs,
    count: requirementsFirst.result.length
  });

  const requirementsSecond = await time("requirements_second", () => llmRequirementExtractionService.extract(posting.content));
  results.push({
    label: "requirements_second",
    durationMs: requirementsSecond.durationMs,
    count: requirementsSecond.result.length
  });

  const evidenceResolution = await time("evidence_resolution", () =>
    resolveFitAnalysisEvidence(posting.content, requirementsFirst.result)
  );
  results.push({
    label: "evidence_resolution",
    durationMs: evidenceResolution.durationMs,
    count: evidenceResolution.result.length
  });

  const fitUrlFirst = await time("fit_url_first", () =>
    heuristicFitAnalysisService.analyze(
      { kind: "url", url, content: posting.content, targetSummary: posting.targetSummary },
      "bench-url-first",
      presentationMode
    )
  );
  results.push({
    label: "fit_url_first",
    durationMs: fitUrlFirst.durationMs,
    verdict: readPresentationVerdict(fitUrlFirst.result)
  });

  const fitUrlSecond = await time("fit_url_second", () =>
    heuristicFitAnalysisService.analyze(
      { kind: "url", url, content: posting.content, targetSummary: posting.targetSummary },
      "bench-url-second",
      presentationMode
    )
  );
  results.push({
    label: "fit_url_second",
    durationMs: fitUrlSecond.durationMs,
    verdict: readPresentationVerdict(fitUrlSecond.result)
  });

  const fitTextFirst = await time("fit_text_first", () =>
    heuristicFitAnalysisService.analyze(
      { kind: "text", text: posting.content },
      "bench-text-first",
      presentationMode
    )
  );
  results.push({
    label: "fit_text_first",
    durationMs: fitTextFirst.durationMs,
    verdict: readPresentationVerdict(fitTextFirst.result)
  });

  const fitTextSecond = await time("fit_text_second", () =>
    heuristicFitAnalysisService.analyze(
      { kind: "text", text: posting.content },
      "bench-text-second",
      presentationMode
    )
  );
  results.push({
    label: "fit_text_second",
    durationMs: fitTextSecond.durationMs,
    verdict: readPresentationVerdict(fitTextSecond.result)
  });

  console.log(
    JSON.stringify(
      {
        url,
        presentationMode,
        chatProvider: hasProviderConfig("chat") ? readProviderSummary("chat").provider : "unconfigured",
        chatModel: hasProviderConfig("chat") ? readProviderSummary("chat").model : "unconfigured",
        fitProvider: hasProviderConfig("fit") ? readProviderSummary("fit").provider : "unconfigured",
        fitModel: hasProviderConfig("fit") ? readProviderSummary("fit").model : "unconfigured",
        requirementsProvider: hasProviderConfig("requirements") ? readProviderSummary("requirements").provider : "unconfigured",
        requirementsModel: hasProviderConfig("requirements") ? readProviderSummary("requirements").model : "unconfigured",
        embeddingsProvider: hasProviderConfig("embeddings") ? readProviderSummary("embeddings").provider : "unconfigured",
        embeddingsModel: hasProviderConfig("embeddings") ? readProviderSummary("embeddings").model : "unconfigured",
        results
      },
      null,
      2
    )
  );
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
