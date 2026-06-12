import test from "node:test";
import assert from "node:assert/strict";
import { isCredentialEvidenceQuery, staticRetrievalStore } from "@/lib/retrieval/store";
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

test("staticRetrievalStore batch search preserves single-query retrieval behavior", async () => {
  const query = "product strategy and roadmap execution";
  const single = await staticRetrievalStore.searchEvidence(query, "fit_analysis");
  const [batched] = await staticRetrievalStore.searchEvidenceBatch([query], "fit_analysis");

  assert.deepEqual(
    batched.map((item) => item.id),
    single.map((item) => item.id)
  );
});

test("credential evidence is limited to certification and knowledge queries", () => {
  assert.equal(isCredentialEvidenceQuery("Anthropic certification or equivalent credential required"), true);
  assert.equal(isCredentialEvidenceQuery("Working knowledge of Claude API and MCP"), true);
  assert.equal(isCredentialEvidenceQuery("Working knowledge of production-grade Claude application architecture"), true);
  assert.equal(isCredentialEvidenceQuery("Understanding of build systems"), true);
  assert.equal(isCredentialEvidenceQuery("Working knowledge of Claude API and build systems"), true);
  assert.equal(isCredentialEvidenceQuery("Familiarity with CI/CD and deploy tooling"), true);
  assert.equal(isCredentialEvidenceQuery("Proficiency with Claude API and MCP"), true);
  assert.equal(isCredentialEvidenceQuery("Expertise in Claude API and MCP"), true);
  assert.equal(isCredentialEvidenceQuery("Knowledgeable about Claude API and MCP"), true);
  assert.equal(
    isCredentialEvidenceQuery("Working knowledge of Claude API and build systems; deploy production integrations"),
    false
  );
  assert.equal(isCredentialEvidenceQuery("Lead production Claude API and MCP implementations"), false);
  assert.equal(isCredentialEvidenceQuery("Working knowledge of Claude API with experience building production agents"), false);
  assert.equal(isCredentialEvidenceQuery("Hands-on implementation of Claude API integrations"), false);
  assert.equal(isCredentialEvidenceQuery("Strong understanding of Claude API and build production agents"), false);
  assert.equal(isCredentialEvidenceQuery("Working knowledge of Claude API; deploy production integrations"), false);
  assert.equal(isCredentialEvidenceQuery("Working knowledge of Claude API with capability to build production agents"), false);
  assert.equal(isCredentialEvidenceQuery("Strong understanding of Claude API; must build production agents"), false);
  assert.equal(isCredentialEvidenceQuery("Working knowledge of Claude API and will build production agents"), false);
  assert.equal(isCredentialEvidenceQuery("Working knowledge of Claude API and you will deploy production integrations"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and ownership of production integrations"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and leadership of production implementations"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and responsibility for production integrations"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and design production agent systems"), false);
  assert.equal(isCredentialEvidenceQuery("Understanding of MCP plus integrate Claude into production workflows"), false);
  assert.equal(isCredentialEvidenceQuery("Familiarity with Claude Code and ship production agents"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and launch production agents"), false);
  assert.equal(isCredentialEvidenceQuery("Understanding of MCP plus scale production workflows"), false);
  assert.equal(isCredentialEvidenceQuery("Familiarity with Claude Code and maintain agent infrastructure"), false);
  assert.equal(isCredentialEvidenceQuery("Expertise in Claude API and configure production integrations"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and oversee production deployments"), false);
  assert.equal(isCredentialEvidenceQuery("Understanding of MCP plus drive production rollout"), false);
  assert.equal(isCredentialEvidenceQuery("Familiarity with Claude Code and execute production integrations"), false);
  assert.equal(isCredentialEvidenceQuery("Expertise in Claude API and run production agent operations"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of MCP and ability to successfully build production agents"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and successfully build production agents"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and rapidly deploy production integrations"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API, while responsible for production delivery"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API while building production agents"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and integrating Claude into production workflows"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and production agents were built at scale"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API - deploy production integrations"), false);
  assert.equal(isCredentialEvidenceQuery("Familiarity with MCP / build production agents"), false);
  assert.equal(
    isCredentialEvidenceQuery("Strong understanding of Claude API and MCP, with experience leading production implementations"),
    false
  );
});
