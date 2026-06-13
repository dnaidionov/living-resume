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
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API plus build systems"), true);
  assert.equal(isCredentialEvidenceQuery("Expertise in Claude API as well as deploy tooling"), true);
  assert.equal(isCredentialEvidenceQuery("Proficiency with Claude API and MCP"), true);
  assert.equal(isCredentialEvidenceQuery("Proficiency in Claude API and MCP"), true);
  assert.equal(isCredentialEvidenceQuery("Proficient in Claude API and MCP"), true);
  assert.equal(isCredentialEvidenceQuery("Highly proficient with Claude API and MCP"), true);
  assert.equal(isCredentialEvidenceQuery("Expertise in Claude API and MCP"), true);
  assert.equal(isCredentialEvidenceQuery("Knowledgeable about Claude API and MCP"), true);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API / MCP / build systems"), true);
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
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and be able to deploy production integrations"), false);
  assert.equal(
    isCredentialEvidenceQuery("Candidates should be knowledgeable about Claude API and able to deploy production integrations"),
    false
  );
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and should deploy production integrations"), false);
  assert.equal(isCredentialEvidenceQuery("Should deploy production integrations and knowledge of Claude API"), false);
  assert.equal(
    isCredentialEvidenceQuery("Knowledge of Claude API and the successful candidate will deploy production integrations"),
    false
  );
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and you'll deploy production integrations"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and you’ll deploy production integrations"), false);
  assert.equal(
    isCredentialEvidenceQuery("Knowledge of Claude API and a successful applicant will deploy production integrations"),
    false
  );
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and you are expected to deploy production integrations"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and you’d deploy production integrations"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and successful candidates will deploy production integrations"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and successful applicants will deploy production integrations"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and they will deploy production integrations"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and she will deploy production integrations"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and we expect you to deploy production integrations"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and the recruiter expects you to deploy production integrations"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and you're expected to deploy production integrations"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and the person in this role will deploy production integrations"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and the successful candidate is expected to deploy production integrations"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and candidates are expected to deploy production integrations"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and the role holder needs to deploy production integrations"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and the incumbent will deploy production integrations"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and you must be able to deploy production integrations"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and the candidate would deploy production integrations"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and candidates have to build production agents"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and the role holder shall deploy production integrations"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and deploy production integrations and familiarity with MCP"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and ownership of integration frameworks"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and leadership of architecture frameworks"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and responsibility for platform models"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API, build and deploy production agents"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and can deploy production integrations"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and expected to deploy production integrations"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and needs to deploy production integrations"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API | deploy production integrations"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API—deploy production integrations"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API & deploy production integrations"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API/MCP/deploy production integrations"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of platforms that can deploy models automatically"), true);
  assert.equal(isCredentialEvidenceQuery("Knowledge of tools that may build dependency graphs"), true);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and design systems"), true);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API—build-vs-buy tradeoffs"), true);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API | design and architecture patterns"), true);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API & design systems"), true);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API / design systems"), true);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API plus design patterns"), true);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and tools that teams can deploy securely"), true);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and systems the candidate may design"), true);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and design systems ownership"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and architecture ownership"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of systems ownership models"), true);
  assert.equal(isCredentialEvidenceQuery("Knowledge of platform leadership principles"), true);
  assert.equal(isCredentialEvidenceQuery("Knowledge of product responsibility matrices"), true);
  assert.equal(isCredentialEvidenceQuery("Knowledge of systems that were designed to deploy models securely"), true);
  assert.equal(isCredentialEvidenceQuery("Knowledge of platforms built to operate production agents"), true);
  assert.equal(isCredentialEvidenceQuery("Knowledge of operating systems and Claude API"), true);
  assert.equal(isCredentialEvidenceQuery("Knowledge of managed services and Claude API"), true);
  assert.equal(isCredentialEvidenceQuery("Knowledge of integrated development environments and Claude API"), true);
  assert.equal(isCredentialEvidenceQuery("Knowledge of design system ownership maturity models"), true);
  assert.equal(isCredentialEvidenceQuery("Knowledge of platform leadership competency frameworks"), true);
  assert.equal(isCredentialEvidenceQuery("Knowledge of product responsibility assignment matrices"), true);
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
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API, deploy production integrations"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API: deploy production integrations"), false);
  assert.equal(isCredentialEvidenceQuery("Knowledge of Claude API and the team will deploy production integrations"), false);
  assert.equal(
    isCredentialEvidenceQuery("Knowledge of Claude API and production integrations were successfully deployed"),
    false
  );
  assert.equal(
    isCredentialEvidenceQuery("Knowledge of Claude API and integrations are actively being deployed"),
    false
  );
  assert.equal(
    isCredentialEvidenceQuery("Knowledge of Claude API plus build systems plus deploy production integrations"),
    false
  );
  assert.equal(
    isCredentialEvidenceQuery("Strong understanding of Claude API and MCP, with experience leading production implementations"),
    false
  );
});
