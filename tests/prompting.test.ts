import test from "node:test";
import assert from "node:assert/strict";
import { buildFallbackFitAnalysisSummary, buildFitAnalysisUserPrompt, extractRoleRequirements, normalizeFitAnalysisResult } from "@/lib/ai/prompting";
import type { EvidenceChunk } from "@/types/content";

const evidence: EvidenceChunk[] = [
  {
    id: "role-1",
    sourceType: "resume",
    title: "Senior Product Manager at EPAM",
    section: "achievement-1",
    text: "Led AI evaluation and developer experience initiatives.",
    tags: ["ai", "product"],
    embedding: [1, 0, 0]
  },
  {
    id: "project-1",
    sourceType: "project",
    title: "Living Resume",
    section: "summary",
    text: "Built a grounded resume experience with retrieval and fit analysis.",
    tags: ["ai", "execution"],
    embedding: [0, 1, 0]
  }
];

test("normalizeFitAnalysisResult preserves revised dimensions and citations", () => {
  const result = normalizeFitAnalysisResult(
    {
      overallSummary: "Strong top-of-funnel qualification for the role.",
      overallScore: 8,
      dimensions: [
        {
          name: "core_match",
          score: 4,
          rationale: "Direct product ownership evidence is present.",
          evidence: ["Senior Product Manager at EPAM"]
        }
      ],
      strengths: ["Grounded product strategy."],
      confidence: "high"
    },
    evidence,
    "text"
  );

  assert.equal(result.dimensions.length, 4);
  assert.equal(result.dimensions[0]?.name, "core_match");
  assert.equal(result.dimensions[1]?.name, "execution_scope");
  assert.equal(result.citations.length, 2);
  assert.equal(result.metadata?.inputKind, "text");
  assert.equal(result.metadata?.evaluatorVersion, "v2-qualification-first");
});

test("extractRoleRequirements marks explicit must-haves and nice-to-haves", () => {
  const requirements = extractRoleRequirements(`
    Must have experience owning SaaS product roadmaps.
    Preferred familiarity with healthcare workflows.
    Lead cross-functional execution with engineering and design.
  `);

  assert.equal(requirements[0]?.priority, "must_have");
  assert.equal(requirements[1]?.priority, "nice_to_have");
  assert.equal(requirements[2]?.priority, "important");
});

test("fit-analysis prompt keeps anti-false-negative logic in the hidden prompt", () => {
  const prompt = buildFitAnalysisUserPrompt(
    `Senior Product Manager\nOwn roadmap, customer discovery, and cross-functional delivery for a SaaS platform.`,
    evidence
  );

  assert.match(prompt, /A role that does not mention AI should not be treated as lower fit/);
  assert.match(prompt, /core_match, execution_scope, leadership_collaboration, context_readiness/);
});

test("fallback fit-analysis copy does not mention preferred domains or absent AI language", () => {
  const result = buildFallbackFitAnalysisSummary(
    `Senior Product Manager\nOwn roadmap, customer discovery, and cross-functional delivery for a SaaS platform.`,
    evidence
  );

  const visibleText = [
    result.overallSummary,
    ...result.dimensions.map((item) => item.rationale),
    ...result.gaps,
    ...result.transferableAdvantages,
    ...result.interviewAngles
  ].join(" ");

  assert.doesNotMatch(visibleText, /preferred domains?/i);
  assert.doesNotMatch(visibleText, /absence of ai language/i);
});
