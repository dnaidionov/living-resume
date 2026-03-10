import test from "node:test";
import assert from "node:assert/strict";
import { staticRetrievalStore } from "@/lib/retrieval/store";

test("staticRetrievalStore returns repo-backed evidence even without a generated semantic artifact", async () => {
  const results = await staticRetrievalStore.searchEvidence("product strategy and roadmap execution", "fit_analysis");

  assert.ok(results.length > 0);
  assert.ok(results.every((item) => item.sourceType !== "build_doc"));
});
