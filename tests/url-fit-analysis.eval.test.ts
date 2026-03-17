import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fetchJobDescriptionFromUrl } from "@/lib/platform/url-intake";
import { extractRoleRequirementsHeuristically } from "@/lib/ai/prompting";
import { heuristicFitAnalysisService } from "@/lib/ai/fit-analysis";
import type { FitVerdict } from "@/types/ai";

type UrlFitAnalysisCase = {
  id: string;
  description: string;
  url: string;
  expectedTitle: string;
  expectedCompany: string;
  expectedOutcome?: "positive_fit" | "negative_fit" | FitVerdict;
  enabled?: boolean;
  requiredForBuild?: boolean;
};

const fixturePath = path.join(process.cwd(), "tests/fixtures/url-fit-analysis-cases.json");
const urlFitCases = JSON.parse(readFileSync(fixturePath, "utf8")) as UrlFitAnalysisCase[];
const enabledCases = urlFitCases.filter((item) => item.enabled !== false);

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

function warningPrefix(testCase: UrlFitAnalysisCase): string {
  return `[url-fit-analysis warning] ${testCase.id}`;
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

test("url-fit-analysis fixture keeps required build-gate cases enabled", () => {
  const requiredCases = urlFitCases.filter((item) => item.requiredForBuild);

  assert.ok(requiredCases.length >= 4);
  assert.ok(requiredCases.every((item) => item.enabled !== false));
  assert.deepEqual(
    requiredCases.map((item) => item.id).sort(),
    [
      "motive-staff-product-manager-telematics",
      "netflix-product-manager-enterprise-systems",
      "sourgum-director-of-product",
      "waymo-product-manager-driving-behaviors"
    ]
  );
});

for (const testCase of enabledCases) {
  test(
    `url-fit-analysis eval: ${testCase.id} ingests, parses, and analyzes the remote JD`,
    { timeout: 60_000 },
    async () => {
      const originalApiKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      try {
        const jobDescription = await fetchJobDescriptionFromUrl(testCase.url);

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
            content: jobDescription
          },
          `qa-url-fit-${testCase.id}`,
          "recruiter_brief"
        );

        assert.equal(result.metadata?.inputKind, "url");
        assert.equal(result.presentation.mode, "recruiter_brief");

        const verdict = result.presentation.overallMatch.verdict;
        if (!matchesExpectedOutcome(testCase.expectedOutcome, verdict)) {
          console.warn(
            `${warningPrefix(testCase)} expected outcome ${testCase.expectedOutcome} but got ${verdict}.`
          );
        }
      } finally {
        if (originalApiKey) {
          process.env.OPENAI_API_KEY = originalApiKey;
        } else {
          delete process.env.OPENAI_API_KEY;
        }
      }
    }
  );
}
