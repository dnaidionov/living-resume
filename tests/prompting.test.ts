import test from "node:test";
import assert from "node:assert/strict";
import { normalizeFitAnalysisResult } from "@/lib/ai/prompting";
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

test("normalizeFitAnalysisResult preserves required dimensions and citations", () => {
  const result = normalizeFitAnalysisResult(
    {
      overallSummary: "Strong fit for AI-native product roles.",
      overallScore: 8,
      dimensions: [
        {
          name: "domain",
          score: 4,
          rationale: "Direct AI product evidence is present.",
          evidence: ["Senior Product Manager at EPAM"]
        }
      ],
      strengths: ["Grounded AI product strategy."],
      confidence: "high"
    },
    evidence,
    "text"
  );

  assert.equal(result.dimensions.length, 4);
  assert.equal(result.dimensions[0]?.name, "domain");
  assert.equal(result.dimensions[1]?.name, "execution");
  assert.equal(result.citations.length, 2);
  assert.equal(result.metadata?.inputKind, "text");
  assert.equal(result.metadata?.evaluatorVersion, "v2-llm");
});
