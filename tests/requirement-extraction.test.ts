import test from "node:test";
import assert from "node:assert/strict";
import { createRequirementExtractionService } from "@/lib/ai/requirement-extraction";
import { extractRoleRequirementsHeuristically } from "@/lib/ai/prompting";

test("requirement extraction caches identical JD input", async () => {
  let calls = 0;
  const service = createRequirementExtractionService(
    async () => {
      calls += 1;
      return {
        requirements: [
          {
            text: "Lead product strategy and roadmap for a B2B SaaS platform.",
            category: "function",
            priority: "important"
          }
        ]
      };
    },
    () => true
  );

  const first = await service.extract("Lead product strategy and roadmap for a B2B SaaS platform.");
  const second = await service.extract("Lead product strategy and roadmap for a B2B SaaS platform.");

  assert.equal(calls, 1);
  assert.deepEqual(second, first);
});

test("requirement extraction does not reuse cache across different JD text", async () => {
  let calls = 0;
  const service = createRequirementExtractionService(
    async ({ userPrompt }) => {
      calls += 1;
      return {
        requirements: [
          {
            text: userPrompt.includes("mobile")
              ? "Own the mobile product roadmap."
              : "Lead product strategy and roadmap for a B2B SaaS platform.",
            category: "function",
            priority: "important"
          }
        ]
      };
    },
    () => true
  );

  await service.extract("Lead product strategy and roadmap for a B2B SaaS platform.");
  const second = await service.extract("Own the mobile product roadmap.");

  assert.equal(calls, 2);
  assert.match(second[0]?.text ?? "", /mobile/i);
});

test("requirement extraction splits credential knowledge from production delivery", async () => {
  const service = createRequirementExtractionService(
    async () => ({
      requirements: [
        {
          text: "Strong understanding of Claude API and MCP, with experience leading production implementations.",
          category: "requirement",
          priority: "must_have"
        }
      ]
    }),
    () => true
  );

  const requirements = await service.extract("Strong understanding of Claude API and MCP, with experience leading production implementations.");

  assert.equal(requirements.length, 2);
  assert.match(requirements[0]?.text ?? "", /understanding of Claude API and MCP/i);
  assert.doesNotMatch(requirements[0]?.text ?? "", /production implementations/i);
  assert.match(requirements[1]?.text ?? "", /leading production implementations/i);
  assert.doesNotMatch(requirements[1]?.text ?? "", /understanding of Claude API/i);
});

test("requirement extraction keeps knowledge domains with production and build nouns intact", async () => {
  const service = createRequirementExtractionService(
    async () => ({
      requirements: [
        {
          text: "Working knowledge of production-grade Claude application architecture.",
          category: "requirement",
          priority: "important"
        },
        {
          text: "Understanding of build systems.",
          category: "requirement",
          priority: "important"
        }
      ]
    }),
    () => true
  );

  const requirements = await service.extract("Knowledge requirements");

  assert.equal(requirements.length, 2);
  assert.match(requirements[0]?.text ?? "", /production-grade Claude application architecture/i);
  assert.match(requirements[1]?.text ?? "", /build systems/i);
});

test("requirement extraction keeps coordinated knowledge-domain nouns intact", async () => {
  const service = createRequirementExtractionService(
    async () => ({
      requirements: [
        {
          text: "Working knowledge of Claude API and build systems.",
          category: "requirement",
          priority: "important"
        },
        {
          text: "Familiarity with CI/CD and deploy tooling.",
          category: "requirement",
          priority: "important"
        }
      ]
    }),
    () => true
  );

  const requirements = await service.extract("Coordinated knowledge-domain requirements");

  assert.equal(requirements.length, 2);
  assert.equal(requirements[0]?.text, "Working knowledge of Claude API and build systems.");
  assert.equal(requirements[1]?.text, "Familiarity with CI/CD and deploy tooling.");
});

test("requirement extraction does not let knowledge-domain nouns mask later delivery clauses", async () => {
  const service = createRequirementExtractionService(
    async () => ({
      requirements: [
        {
          text: "Working knowledge of Claude API and build systems; deploy production integrations.",
          category: "requirement",
          priority: "must_have"
        }
      ]
    }),
    () => true
  );

  const requirements = await service.extract("Knowledge domain followed by delivery");

  assert.equal(requirements.length, 2);
  assert.equal(requirements[0]?.text, "Working knowledge of Claude API and build systems");
  assert.equal(requirements[1]?.text, "deploy production integrations");
});

test("requirement extraction splits common forward and reverse compound connectors", async () => {
  const service = createRequirementExtractionService(
    async () => ({
      requirements: [
        {
          text: "Knowledge of Claude API as well as experience building production agents.",
          category: "requirement",
          priority: "must_have"
        },
        {
          text: "Knowledge of Claude API, plus experience building production agents.",
          category: "requirement",
          priority: "must_have"
        },
        {
          text: "Lead production implementations and knowledge of Claude API.",
          category: "requirement",
          priority: "must_have"
        },
        {
          text: "Certified in Claude API and responsible to deploy production integrations.",
          category: "requirement",
          priority: "must_have"
        }
      ]
    }),
    () => true
  );

  const requirements = await service.extract("Common compound connectors");
  const labels = requirements.map((item) => item.text);

  assert.equal(requirements.length, 8);
  assert.equal(labels.filter((item) => /^Knowledge of Claude API$/i.test(item)).length, 3);
  assert.equal(labels.filter((item) => /^experience building production agents$/i.test(item)).length, 2);
  assert.ok(labels.some((item) => /^Lead production implementations$/i.test(item)));
  assert.ok(labels.some((item) => /^Certified in Claude API$/i.test(item)));
  assert.ok(labels.some((item) => /^responsible to deploy production integrations$/i.test(item)));
});

test("requirement extraction splits noun-form ownership and unpunctuated plus compounds", async () => {
  const service = createRequirementExtractionService(
    async () => ({
      requirements: [
        {
          text: "Knowledge of Claude API and ownership of production integrations.",
          category: "requirement",
          priority: "must_have"
        },
        {
          text: "Knowledge of Claude API plus experience building production agents.",
          category: "requirement",
          priority: "must_have"
        },
        {
          text: "Experience building production agents plus knowledge of Claude API.",
          category: "requirement",
          priority: "must_have"
        }
      ]
    }),
    () => true
  );

  const requirements = await service.extract("Ownership and plus compounds");
  const labels = requirements.map((item) => item.text);

  assert.equal(requirements.length, 6);
  assert.equal(labels.filter((item) => /^Knowledge of Claude API$/i.test(item)).length, 3);
  assert.ok(labels.some((item) => /^ownership of production integrations$/i.test(item)));
  assert.equal(labels.filter((item) => /^experience building production agents$/i.test(item)).length, 2);
});

test("requirement extraction preserves all source requirements after atomic splitting", async () => {
  const service = createRequirementExtractionService(
    async () => ({
      requirements: [
        {
          text: "Knowledge of Claude API and experience building production agents.",
          category: "requirement",
          priority: "must_have"
        },
        ...Array.from({ length: 7 }, (_, index) => ({
          text: `Lead distinct product responsibility number ${index + 2} across the organization.`,
          category: "function" as const,
          priority: "important" as const
        }))
      ]
    }),
    () => true
  );

  const requirements = await service.extract("Eight source requirements with one compound");

  assert.equal(requirements.length, 9);
  assert.ok(requirements.some((item) => /responsibility number 8/i.test(item.text)));
});

test("requirement extraction preserves LLM responses that are already split into atomic requirements", async () => {
  const service = createRequirementExtractionService(
    async () => ({
      requirements: [
        {
          text: "Knowledge of Claude API.",
          category: "requirement",
          priority: "must_have"
        },
        {
          text: "Experience building production agents.",
          category: "function",
          priority: "must_have"
        },
        ...Array.from({ length: 7 }, (_, index) => ({
          text: `Lead distinct product responsibility number ${index + 2} across the organization.`,
          category: "function" as const,
          priority: "important" as const
        }))
      ]
    }),
    () => true
  );

  const requirements = await service.extract("Nine atomic requirements from eight source requirements");

  assert.equal(requirements.length, 9);
  assert.ok(requirements.some((item) => /responsibility number 8/i.test(item.text)));
});

test("heuristic requirement extraction preserves all source requirements after atomic splitting", () => {
  const roleText = [
    "Knowledge of Claude API and experience building production agents.",
    ...Array.from(
      { length: 7 },
      (_, index) => `Lead distinct product responsibility number ${index + 2} across the organization.`
    )
  ].join("\n");

  const requirements = extractRoleRequirementsHeuristically(roleText);

  assert.equal(requirements.length, 9);
  assert.ok(requirements.some((item) => /experience building production agents/i.test(item.text)));
  assert.ok(requirements.some((item) => /responsibility number 8/i.test(item.text)));
});

test("requirement extraction splits launch, scale, maintain, and configure delivery clauses", async () => {
  const service = createRequirementExtractionService(
    async () => ({
      requirements: [
        {
          text: "Knowledge of Claude API and launch production agents.",
          category: "requirement",
          priority: "must_have"
        },
        {
          text: "Understanding of MCP plus scale production workflows.",
          category: "requirement",
          priority: "must_have"
        },
        {
          text: "Familiarity with Claude Code and maintain agent infrastructure.",
          category: "requirement",
          priority: "must_have"
        },
        {
          text: "Expertise in Claude API and configure production integrations.",
          category: "requirement",
          priority: "must_have"
        }
      ]
    }),
    () => true
  );

  const requirements = await service.extract("Additional delivery verb compounds");
  const labels = requirements.map((item) => item.text);

  assert.equal(requirements.length, 8);
  assert.ok(labels.some((item) => /^launch production agents$/i.test(item)));
  assert.ok(labels.some((item) => /^scale production workflows$/i.test(item)));
  assert.ok(labels.some((item) => /^maintain agent infrastructure$/i.test(item)));
  assert.ok(labels.some((item) => /^configure production integrations$/i.test(item)));
});

test("requirement extraction splits oversight, execution, drive, run, and adverbial delivery clauses", async () => {
  const service = createRequirementExtractionService(
    async () => ({
      requirements: [
        {
          text: "Knowledge of Claude API and oversee production deployments.",
          category: "requirement",
          priority: "must_have"
        },
        {
          text: "Understanding of MCP plus drive production rollout.",
          category: "requirement",
          priority: "must_have"
        },
        {
          text: "Familiarity with Claude Code and execute production integrations.",
          category: "requirement",
          priority: "must_have"
        },
        {
          text: "Expertise in Claude API and run production agent operations.",
          category: "requirement",
          priority: "must_have"
        },
        {
          text: "Knowledge of MCP and ability to successfully build production agents.",
          category: "requirement",
          priority: "must_have"
        }
      ]
    }),
    () => true
  );

  const requirements = await service.extract("Additional execution wording");
  const labels = requirements.map((item) => item.text);

  assert.equal(requirements.length, 10);
  assert.ok(labels.some((item) => /^oversee production deployments$/i.test(item)));
  assert.ok(labels.some((item) => /^drive production rollout$/i.test(item)));
  assert.ok(labels.some((item) => /^execute production integrations$/i.test(item)));
  assert.ok(labels.some((item) => /^run production agent operations$/i.test(item)));
  assert.ok(labels.some((item) => /^ability to successfully build production agents$/i.test(item)));
});

test("requirement extraction splits coordinated adverbs, responsibility, gerunds, and passive delivery", async () => {
  const service = createRequirementExtractionService(
    async () => ({
      requirements: [
        {
          text: "Knowledge of Claude API and successfully build production agents.",
          category: "requirement",
          priority: "must_have"
        },
        {
          text: "Knowledge of Claude API and rapidly deploy production integrations.",
          category: "requirement",
          priority: "must_have"
        },
        {
          text: "Knowledge of Claude API, while responsible for production delivery.",
          category: "requirement",
          priority: "must_have"
        },
        {
          text: "Knowledge of Claude API while building production agents.",
          category: "requirement",
          priority: "must_have"
        },
        {
          text: "Knowledge of Claude API and integrating Claude into production workflows.",
          category: "requirement",
          priority: "must_have"
        },
        {
          text: "Knowledge of Claude API and production agents were built at scale.",
          category: "requirement",
          priority: "must_have"
        }
      ]
    }),
    () => true
  );

  const requirements = await service.extract("Coordinated and passive delivery wording");
  const labels = requirements.map((item) => item.text);

  assert.equal(requirements.length, 12);
  assert.ok(labels.some((item) => /^successfully build production agents$/i.test(item)));
  assert.ok(labels.some((item) => /^rapidly deploy production integrations$/i.test(item)));
  assert.ok(labels.some((item) => /^responsible for production delivery$/i.test(item)));
  assert.ok(labels.some((item) => /^building production agents$/i.test(item)));
  assert.ok(labels.some((item) => /^integrating Claude into production workflows$/i.test(item)));
  assert.ok(labels.some((item) => /^production agents were built at scale$/i.test(item)));
});

test("requirement extraction splits dash and slash delivery separators", async () => {
  const service = createRequirementExtractionService(
    async () => ({
      requirements: [
        {
          text: "Knowledge of Claude API - deploy production integrations.",
          category: "requirement",
          priority: "must_have"
        },
        {
          text: "Familiarity with MCP / build production agents.",
          category: "requirement",
          priority: "must_have"
        }
      ]
    }),
    () => true
  );

  const requirements = await service.extract("Punctuation-separated delivery wording");
  const labels = requirements.map((item) => item.text);

  assert.equal(requirements.length, 4);
  assert.ok(labels.some((item) => /^deploy production integrations$/i.test(item)));
  assert.ok(labels.some((item) => /^build production agents$/i.test(item)));
});

test("requirement extraction recognizes broader delivery verbs and knowledge wording", async () => {
  const service = createRequirementExtractionService(
    async () => ({
      requirements: [
        {
          text: "Proficiency with Claude API and design production agent systems.",
          category: "requirement",
          priority: "must_have"
        },
        {
          text: "Expertise in MCP plus integrate Claude into production workflows.",
          category: "requirement",
          priority: "must_have"
        },
        {
          text: "Knowledgeable about Claude Code and ship production agents.",
          category: "requirement",
          priority: "must_have"
        }
      ]
    }),
    () => true
  );

  const requirements = await service.extract("Broader credential and delivery wording");
  const labels = requirements.map((item) => item.text);

  assert.equal(requirements.length, 6);
  assert.ok(labels.some((item) => /^Proficiency with Claude API$/i.test(item)));
  assert.ok(labels.some((item) => /^design production agent systems$/i.test(item)));
  assert.ok(labels.some((item) => /^Expertise in MCP$/i.test(item)));
  assert.ok(labels.some((item) => /^integrate Claude into production workflows$/i.test(item)));
  assert.ok(labels.some((item) => /^Knowledgeable about Claude Code$/i.test(item)));
  assert.ok(labels.some((item) => /^ship production agents$/i.test(item)));
});

test("requirement extraction splits base-form build and deploy delivery clauses", async () => {
  const service = createRequirementExtractionService(
    async () => ({
      requirements: [
        {
          text: "Strong understanding of Claude API and build production agents.",
          category: "requirement",
          priority: "must_have"
        },
        {
          text: "Working knowledge of Claude API; deploy production integrations.",
          category: "requirement",
          priority: "must_have"
        },
        {
          text: "Working knowledge of Claude API with capability to build production agents.",
          category: "requirement",
          priority: "must_have"
        }
      ]
    }),
    () => true
  );

  const requirements = await service.extract("Compound credential and delivery requirements");
  const labels = requirements.map((item) => item.text);

  assert.ok(labels.some((item) => /^Strong understanding of Claude API$/i.test(item)));
  assert.ok(labels.some((item) => /^build production agents$/i.test(item)));
  assert.ok(labels.some((item) => /^Working knowledge of Claude API$/i.test(item)));
  assert.ok(labels.some((item) => /^deploy production integrations$/i.test(item)));
  assert.ok(labels.some((item) => /^capability to build production agents$/i.test(item)));
});

test("requirement extraction splits modal build and deploy delivery clauses", async () => {
  const service = createRequirementExtractionService(
    async () => ({
      requirements: [
        {
          text: "Strong understanding of Claude API; must build production agents.",
          category: "requirement",
          priority: "must_have"
        },
        {
          text: "Working knowledge of Claude API and will build production agents.",
          category: "requirement",
          priority: "must_have"
        },
        {
          text: "Working knowledge of Claude API and you will deploy production integrations.",
          category: "requirement",
          priority: "must_have"
        }
      ]
    }),
    () => true
  );

  const requirements = await service.extract("Modal credential and delivery requirements");
  const labels = requirements.map((item) => item.text);

  assert.ok(labels.some((item) => /^Strong understanding of Claude API$/i.test(item)));
  assert.ok(labels.some((item) => /^must build production agents$/i.test(item)));
  assert.ok(labels.some((item) => /^Working knowledge of Claude API$/i.test(item)));
  assert.ok(labels.some((item) => /^will build production agents$/i.test(item)));
  assert.ok(labels.some((item) => /^you will deploy production integrations$/i.test(item)));
});
