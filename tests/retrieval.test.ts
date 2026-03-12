import test from "node:test";
import assert from "node:assert/strict";
import { staticRetrievalStore } from "@/lib/retrieval/store";
import { buildFitAnalysisQueries } from "@/lib/ai/fit-analysis";

test("staticRetrievalStore returns repo-backed evidence even without a generated semantic artifact", async () => {
  const results = await staticRetrievalStore.searchEvidence("product strategy and roadmap execution", "fit_analysis");

  assert.ok(results.length > 0);
  assert.ok(results.every((item) => item.sourceType !== "build_doc"));
});

test("buildFitAnalysisQueries includes the broad role text plus prioritized requirement queries", () => {
  const queries = buildFitAnalysisQueries(
    "Senior Product Manager role text",
    [
      { text: "Lead product strategy and roadmap", category: "function", priority: "important" },
      { text: "Mentor and develop a product team", category: "requirement", priority: "must_have" },
      { text: "Support company culture", category: "expectation", priority: "nice_to_have" }
    ]
  );

  assert.equal(queries[0], "Senior Product Manager role text");
  assert.match(queries[1] ?? "", /Mentor and develop a product team/);
  assert.match(queries[2] ?? "", /Lead product strategy and roadmap/);
  assert.ok(queries.length >= 3);
});
