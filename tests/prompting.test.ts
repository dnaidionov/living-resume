import test from "node:test";
import assert from "node:assert/strict";
import {
  assembleFitAnalysisResult,
  buildFallbackFitAnalysisResponse,
  buildFitAnalysisUserPrompt,
  extractRoleRequirements
} from "@/lib/ai/prompting";
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

test("assembleFitAnalysisResult preserves internal scorecard and recruiter brief metadata", () => {
  const result = assembleFitAnalysisResult({
    input: {
      internal: {
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
        gaps: ["Validate one specialized context requirement."],
        transferableAdvantages: ["Strong cross-functional execution."],
        interviewAngles: ["Ask about roadmap ownership."]
      },
      confidence: "high"
    },
    roleText: "Senior Product Manager responsible for roadmap strategy, cross-functional leadership, and delivery execution.",
    evidence,
    inputKind: "text",
    presentationMode: "recruiter_brief",
    evaluatorVersion: "v3-test"
  });

  assert.equal(result.internal.dimensions.length, 4);
  assert.equal(result.internal.dimensions[0]?.name, "core_match");
  assert.equal(result.presentation.mode, "recruiter_brief");
  assert.equal(result.citations.length, 2);
  assert.equal(result.metadata?.inputKind, "text");
  assert.equal(result.metadata?.evaluatorVersion, "v3-test");
  assert.equal(result.metadata?.presentationMode, "recruiter_brief");
});

test("extractRoleRequirements marks explicit must-haves and nice-to-haves", () => {
  const requirements = extractRoleRequirements(`
    Must have experience owning SaaS product roadmaps.
    Preferred familiarity with healthcare workflows.
    Lead cross-functional execution with engineering and design.
  `);

  const priorities = requirements.map((item) => item.priority);
  assert.ok(priorities.includes("must_have"));
  assert.ok(priorities.includes("nice_to_have"));
  assert.ok(priorities.includes("important"));
});

test("extractRoleRequirements filters titles, locations, and boilerplate", () => {
  const requirements = extractRoleRequirements(`
    Senior Product Manager, Planner
    Mountain View, California, United States; San Francisco
    Bring fully autonomous driving technology to market.
    Develop a roadmap and determine product requirements for planner.
    Equal opportunity employer statement and apply now content.
  `);

  const labels = requirements.map((item) => item.requirement);
  assert.equal(labels.includes("Senior Product Manager, Planner"), false);
  assert.equal(labels.some((item) => /Mountain View|California|San Francisco/i.test(item)), false);
  assert.equal(labels.some((item) => /Equal opportunity|apply now/i.test(item)), false);
  assert.ok(labels.some((item) => /autonomous driving technology to market/i.test(item)));
  assert.ok(labels.some((item) => /roadmap and determine product requirements/i.test(item)));
});

test("fit-analysis prompt keeps anti-false-negative logic in the hidden prompt", () => {
  const prompt = buildFitAnalysisUserPrompt(
    `Senior Product Manager\nOwn roadmap, customer discovery, and cross-functional delivery for a SaaS platform.`,
    evidence,
    "recruiter_brief"
  );

  assert.match(prompt, /A role that does not mention AI should not be treated as lower fit/);
  assert.match(prompt, /Strong Fit - Let's talk, Probably a Good Fit, Honest Assessment - Probably Not Your Person/);
});

test("fallback recruiter brief does not mention preferred domains or absent AI language", () => {
  const result = buildFallbackFitAnalysisResponse(
    `Senior Product Manager\nOwn roadmap, customer discovery, and cross-functional delivery for a SaaS platform.`,
    evidence,
    "text",
    "recruiter_brief"
  );

  assert.equal(result.presentation.mode, "recruiter_brief");
  const brief = result.presentation;
  const visibleText = [
    brief.overallMatch.label,
    ...(brief.whereIMatch ?? []).map((item) => `${item.requirement} ${item.support}`),
    ...(brief.gapsToNote ?? []).map((item) => `${item.requirement} ${item.gap}`),
    ...(brief.whereIDontFit ?? []).map((item) => `${item.requirement} ${item.gap}`),
    ...(brief.whatDoesTransfer ?? []).map((item) => `${item.skillOrExperience} ${item.relevance}`),
    brief.recommendation
  ].join(" ");

  assert.doesNotMatch(visibleText, /preferred domains?/i);
  assert.doesNotMatch(visibleText, /absence of ai language/i);
});

test("strong-fit recruiter brief uses requirement titles with evidence text and a non-redundant recommendation", () => {
  const result = buildFallbackFitAnalysisResponse(
    `Senior Product Manager
    Must have ownership of roadmap strategy.
    Must have cross-functional stakeholder alignment.
    Must have delivery execution across product teams.
    Must have measurable business outcomes.
    Must have product discovery leadership.`,
    evidence,
    "text",
    "recruiter_brief"
  );

  assert.equal(result.presentation.mode, "recruiter_brief");
  const brief = result.presentation;

  if (brief.overallMatch.verdict !== "strong_fit_lets_talk" && brief.overallMatch.verdict !== "probably_a_good_fit") {
    assert.fail("Expected a positive-fit recruiter brief.");
  }

  assert.ok((brief.whereIMatch?.length ?? 0) >= 3);
  assert.ok((brief.whereIMatch?.[0]?.requirement ?? "").length > 0);
  assert.ok((brief.whereIMatch?.[0]?.support ?? "").length > 0);
  assert.match(brief.whereIMatch?.[0]?.support ?? "", /^At .+, I /);
  assert.doesNotMatch(brief.whereIMatch?.[0]?.support ?? "", /Sales and support teams had thousands of documents/i);
  assert.doesNotMatch(brief.recommendation, /The evidence points|The strongest support comes from/i);
});

test("scorecard mode remains available for A\/B testing", () => {
  const result = buildFallbackFitAnalysisResponse(
    `Senior Product Manager\nOwn roadmap, customer discovery, and cross-functional delivery for a SaaS platform.`,
    evidence,
    "text",
    "scorecard"
  );

  assert.equal(result.presentation.mode, "scorecard");
  assert.equal(result.presentation.dimensions[0]?.name, "core_match");
});
