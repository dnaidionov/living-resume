import test from "node:test";
import assert from "node:assert/strict";
import { assembleFitAnalysisResult } from "@/lib/ai/prompting";
import { buildFallbackFitAnalysisResponse } from "@/lib/ai/prompting";
import { extractRoleRequirementsHeuristically } from "@/lib/ai/prompting";
import type { EvidenceChunk } from "@/types/content";

const evidence: EvidenceChunk[] = [
  {
    id: "resume-epam-1",
    sourceType: "resume",
    title: "Senior Product Manager at EPAM",
    section: "achievement-1",
    text: "Led AI evaluation and developer experience initiatives across regulated product environments.",
    tags: ["product", "ai", "leadership", "regulated"],
    embedding: [1, 0, 0]
  },
  {
    id: "resume-modus-1",
    sourceType: "resume",
    title: "Product Strategist at Modus Create",
    section: "achievement-1",
    text: "Redesigned Product Kickstart to move teams from ambiguous ideas to validated MVP roadmaps.",
    tags: ["product", "strategy", "roadmap", "execution"],
    embedding: [0, 1, 0]
  },
  {
    id: "project-healthcare-1",
    sourceType: "project",
    title: "Healthcare Fleet Management Portal",
    section: "action-1",
    text: "Defined the product workflow and delivery plan for a portal projected to deliver $8-10M in first-year savings.",
    tags: ["healthcare", "workflow", "delivery", "outcomes"],
    embedding: [0, 0, 1]
  }
];

test("eval: non-AI product role remains a positive top-of-funnel fit", () => {
  const jd = `
    Senior Product Manager
    Own roadmap strategy for a SaaS workflow product.
    Lead cross-functional execution with engineering and design.
    Partner with stakeholders to turn customer feedback into product priorities.
    Drive delivery outcomes and product discovery.
  `;

  const result = buildFallbackFitAnalysisResponse(
    jd,
    extractRoleRequirementsHeuristically(jd),
    evidence,
    "text",
    "recruiter_brief"
  );

  assert.equal(result.presentation.mode, "recruiter_brief");
  assert.notEqual(result.presentation.overallMatch.verdict, "probably_not_your_person");
});

test("eval: AI-native role can still produce a strong-fit verdict", () => {
  const jd = `
    Senior Product Manager, AI
    Define roadmap strategy for LLM-driven workflows.
    Lead evaluation quality improvements with engineering partners.
    Drive product requirements for AI-assisted developer tooling.
  `;

  const result = buildFallbackFitAnalysisResponse(
    jd,
    extractRoleRequirementsHeuristically(jd),
    evidence,
    "text",
    "recruiter_brief"
  );

  assert.equal(result.presentation.mode, "recruiter_brief");
  assert.equal(result.presentation.overallMatch.verdict, "strong_fit_lets_talk");
});

test("eval: stretch-role fixture exercises the negative recruiter-brief path", () => {
  const jd = `
    Vice President of Product
    Must have P&L ownership across a large consumer marketplace organization.
    Must have direct experience managing directors and multi-layer product management teams.
    Must have direct marketplace growth leadership at enterprise scale.
  `;

  const result = assembleFitAnalysisResult({
    input: {
      internal: {
        overallSummary: "The current corpus does not prove the executive scope this role requires.",
        overallScore: 3,
        dimensions: [
          { name: "core_match", score: 2, rationale: "The available evidence does not prove this executive scope.", evidence: [] },
          { name: "execution_scope", score: 3, rationale: "Some adjacent execution evidence exists.", evidence: [] },
          { name: "leadership_collaboration", score: 2, rationale: "The evidence does not show this management scale.", evidence: [] },
          { name: "context_readiness", score: 2, rationale: "The marketplace and P&L context is unsupported.", evidence: [] }
        ],
        strengths: [],
        gaps: [],
        transferableAdvantages: [],
        interviewAngles: []
      }
    },
    requirements: extractRoleRequirementsHeuristically(jd),
    evidence,
    inputKind: "text",
    presentationMode: "recruiter_brief",
    evaluatorVersion: "eval-fixture"
  });

  assert.equal(result.presentation.mode, "recruiter_brief");
  assert.equal(result.presentation.overallMatch.verdict, "probably_not_your_person");
  assert.ok((result.presentation.whereIDontFit?.length ?? 0) > 0);
});
