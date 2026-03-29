import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { heuristicFitAnalysisService } from "@/lib/ai/fit-analysis";
import { extractRoleRequirementsHeuristically } from "@/lib/ai/prompting";
import { loadLocalEnv } from "@/lib/env/load-local-env";
import { fetchJobPostingFromUrl } from "@/lib/platform/url-intake";
import { formatDeployUrlEvalSummary, shouldBlockDeployOnUrlEval, type DeployUrlEvalSummary } from "@/lib/deploy/url-eval-policy";
import type { FitVerdict } from "@/types/ai";

type UrlFitAnalysisCase = {
  id: string;
  description: string;
  url: string;
  expectedTitle: string;
  expectedCompany: string;
  expectedTargetTitle?: string;
  expectedTargetCompany?: string;
  expectedOutcome?: "positive_fit" | "negative_fit" | FitVerdict;
  enabled?: boolean;
  requiredForBuild?: boolean;
};

const requiredBuildCaseIds = [
  "motive-staff-product-manager-telematics",
  "netflix-product-manager-enterprise-systems",
  "sourgum-director-of-product",
  "waymo-product-manager-driving-behaviors"
];

function loadUrlFitCases(): UrlFitAnalysisCase[] {
  const fixturePath = path.join(process.cwd(), "tests/fixtures/url-fit-analysis-cases.json");
  return JSON.parse(readFileSync(fixturePath, "utf8")) as UrlFitAnalysisCase[];
}

function validateRequiredBuildCases(urlFitCases: UrlFitAnalysisCase[]) {
  const requiredCases = urlFitCases.filter((item) => item.requiredForBuild);

  assert.ok(requiredCases.length >= 4);
  assert.ok(requiredCases.every((item) => item.enabled !== false));
  assert.deepEqual(
    requiredCases.map((item) => item.id).sort(),
    [...requiredBuildCaseIds].sort()
  );
}

function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function includesNormalized(text: string, expected: string): boolean {
  return normalizeForMatch(text).includes(normalizeForMatch(expected));
}

function matchesExpectedOutcome(expectedOutcome: UrlFitAnalysisCase["expectedOutcome"], verdict: FitVerdict): boolean {
  if (!expectedOutcome) {
    return true;
  }

  if (expectedOutcome === "positive_fit") {
    return verdict === "strong_fit_lets_talk" || verdict === "probably_a_good_fit";
  }

  if (expectedOutcome === "negative_fit") {
    return verdict === "probably_not_your_person";
  }

  return verdict === expectedOutcome;
}

async function verifyCase(testCase: UrlFitAnalysisCase) {
  const originalEnv = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    AI_CHAT_PROVIDER: process.env.AI_CHAT_PROVIDER,
    AI_FIT_PROVIDER: process.env.AI_FIT_PROVIDER,
    AI_REQUIREMENTS_PROVIDER: process.env.AI_REQUIREMENTS_PROVIDER,
    AI_EMBEDDINGS_PROVIDER: process.env.AI_EMBEDDINGS_PROVIDER
  };

  delete process.env.OPENAI_API_KEY;
  delete process.env.OPENROUTER_API_KEY;
  delete process.env.AI_CHAT_PROVIDER;
  delete process.env.AI_FIT_PROVIDER;
  delete process.env.AI_REQUIREMENTS_PROVIDER;
  delete process.env.AI_EMBEDDINGS_PROVIDER;

  try {
    const posting = await fetchJobPostingFromUrl(testCase.url);
    const jobDescription = posting.content;

    assert.ok(jobDescription.length >= 300, `${testCase.id} returned too little JD text.`);
    assert.notEqual(jobDescription.trim(), testCase.url);
    assert.ok(
      includesNormalized(jobDescription, testCase.expectedTitle),
      `${testCase.id} did not include expected title "${testCase.expectedTitle}".`
    );
    assert.ok(
      includesNormalized(jobDescription, testCase.expectedCompany),
      `${testCase.id} did not include expected company "${testCase.expectedCompany}".`
    );

    const requirements = extractRoleRequirementsHeuristically(jobDescription);
    assert.ok(requirements.length > 0, `${testCase.id} did not produce extracted requirements.`);
    assert.ok(
      requirements.every((item) => !/https?:\/\//i.test(item.text)),
      `${testCase.id} requirement extraction leaked raw URLs into parsed requirements.`
    );

    const result = await heuristicFitAnalysisService.analyze(
      {
        kind: "url",
        url: testCase.url,
        content: jobDescription,
        targetSummary: posting.targetSummary
      },
      `deploy-url-fit-${testCase.id}`,
      "recruiter_brief"
    );

    assert.equal(result.metadata?.inputKind, "url");
    assert.equal(result.presentation.mode, "recruiter_brief");
    assert.ok(
      includesNormalized(
        result.metadata?.targetSummary?.roleTitle ?? "",
        testCase.expectedTargetTitle ?? testCase.expectedTitle
      ),
      `${testCase.id} targetSummary did not keep expected title "${testCase.expectedTargetTitle ?? testCase.expectedTitle}".`
    );
    assert.ok(
      includesNormalized(
        result.metadata?.targetSummary?.companyName ?? "",
        testCase.expectedTargetCompany ?? testCase.expectedCompany
      ),
      `${testCase.id} targetSummary did not keep expected company "${testCase.expectedTargetCompany ?? testCase.expectedCompany}".`
    );

    const verdict = result.presentation.overallMatch.verdict;
    if (!matchesExpectedOutcome(testCase.expectedOutcome, verdict)) {
      console.warn(
        `[deploy-url-evals warning] ${testCase.id} expected outcome ${testCase.expectedOutcome} but got ${verdict}.`
      );
    }
  } finally {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value) {
        process.env[key] = value;
      } else {
        delete process.env[key];
      }
    }
  }
}

async function main() {
  loadLocalEnv();

  const urlFitCases = loadUrlFitCases();
  validateRequiredBuildCases(urlFitCases);
  const requiredCases = urlFitCases.filter((item) => item.requiredForBuild && item.enabled !== false);

  const summary: DeployUrlEvalSummary = {
    totalRequired: requiredCases.length,
    passedIds: [],
    failed: []
  };

  for (const testCase of requiredCases) {
    try {
      await verifyCase(testCase);
      summary.passedIds.push(testCase.id);
      console.log(`[deploy-url-evals] pass ${testCase.id}`);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      summary.failed.push({ id: testCase.id, reason });
      console.warn(`[deploy-url-evals] skip ${testCase.id}: ${reason}`);
    }
  }

  console.log(formatDeployUrlEvalSummary(summary));

  if (summary.failed.length > 0) {
    console.warn(
      JSON.stringify(
        {
          skippedCases: summary.failed
        },
        null,
        2
      )
    );
  }

  if (shouldBlockDeployOnUrlEval(summary)) {
    throw new Error("Cloudflare deployment is blocked because all required external URL eval cases failed.");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
