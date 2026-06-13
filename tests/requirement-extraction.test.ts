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

test("requirement extraction keeps coordinated knowledge domains intact across equivalent connectors", async () => {
  const service = createRequirementExtractionService(
    async () => ({
      requirements: [
        {
          text: "Knowledge of Claude API plus build systems.",
          category: "requirement",
          priority: "important"
        },
        {
          text: "Expertise in Claude API as well as deploy tooling.",
          category: "requirement",
          priority: "important"
        }
      ]
    }),
    () => true
  );

  const requirements = await service.extract("Equivalent knowledge-domain connectors");

  assert.equal(requirements.length, 2);
  assert.equal(requirements[0]?.text, "Knowledge of Claude API plus build systems.");
  assert.equal(requirements[1]?.text, "Expertise in Claude API as well as deploy tooling.");
});

test("requirement extraction keeps proficiency-in and slash-separated knowledge domains intact", async () => {
  const service = createRequirementExtractionService(
    async () => ({
      requirements: [
        {
          text: "Proficiency in Claude API and MCP.",
          category: "requirement",
          priority: "important"
        },
        {
          text: "Proficient in Claude API and MCP.",
          category: "requirement",
          priority: "important"
        },
        {
          text: "Highly proficient with Claude API and MCP.",
          category: "requirement",
          priority: "important"
        },
        {
          text: "Knowledge of Claude API / MCP / build systems.",
          category: "requirement",
          priority: "important"
        }
      ]
    }),
    () => true
  );

  const requirements = await service.extract("Equivalent knowledge phrasing and separators");

  assert.equal(requirements.length, 4);
  assert.equal(requirements[0]?.text, "Proficiency in Claude API and MCP.");
  assert.equal(requirements[1]?.text, "Proficient in Claude API and MCP.");
  assert.equal(requirements[2]?.text, "Highly proficient with Claude API and MCP.");
  assert.equal(requirements[3]?.text, "Knowledge of Claude API / MCP / build systems.");
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

test("requirement extraction preserves recursive knowledge domains before splitting delivery", async () => {
  const service = createRequirementExtractionService(
    async () => ({
      requirements: [
        {
          text: "Knowledge of Claude API plus build systems plus deploy production integrations.",
          category: "requirement",
          priority: "must_have"
        }
      ]
    }),
    () => true
  );

  const requirements = await service.extract("Recursive knowledge domain followed by delivery");

  assert.equal(requirements.length, 2);
  assert.equal(requirements[0]?.text, "Knowledge of Claude API plus build systems");
  assert.equal(requirements[1]?.text, "deploy production integrations");
});

test("requirement extraction preserves recursive slash knowledge before delivery", async () => {
  const service = createRequirementExtractionService(
    async () => ({
      requirements: [
        {
          text: "Knowledge of Claude API / MCP / build systems / deploy production integrations.",
          category: "requirement",
          priority: "must_have"
        }
      ]
    }),
    () => true
  );

  const requirements = await service.extract("Recursive slash knowledge followed by delivery");

  assert.equal(requirements.length, 2);
  assert.equal(requirements[0]?.text, "Knowledge of Claude API / MCP / build systems");
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

test("heuristic requirement extraction ranks all source requirements before applying the source cap", () => {
  const roleText = [
    ...Array.from(
      { length: 8 },
      (_, index) => `Support ordinary product responsibility number ${index + 1} across the organization.`
    ),
    "Must have Anthropic certification and experience building production Claude agents."
  ].join("\n");

  const requirements = extractRoleRequirementsHeuristically(roleText);

  assert.ok(requirements.some((item) => /Anthropic certification/i.test(item.text)));
  assert.ok(requirements.some((item) => /experience building production Claude agents/i.test(item.text)));
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

test("requirement extraction splits punctuation, explicit modal subjects, and adverbial passive delivery", async () => {
  const service = createRequirementExtractionService(
    async () => ({
      requirements: [
        {
          text: "Knowledge of Claude API, deploy production integrations.",
          category: "requirement",
          priority: "must_have"
        },
        {
          text: "Knowledge of Claude API: configure production integrations.",
          category: "requirement",
          priority: "must_have"
        },
        {
          text: "Knowledge of Claude API and the team will deploy production integrations.",
          category: "requirement",
          priority: "must_have"
        },
        {
          text: "Knowledge of Claude API and production integrations were successfully deployed.",
          category: "requirement",
          priority: "must_have"
        }
      ]
    }),
    () => true
  );

  const requirements = await service.extract("Punctuation and delivery voice variants");
  const labels = requirements.map((item) => item.text);

  assert.equal(requirements.length, 8);
  assert.equal(labels.filter((item) => /^Knowledge of Claude API$/i.test(item)).length, 4);
  assert.ok(labels.some((item) => /^deploy production integrations$/i.test(item)));
  assert.ok(labels.some((item) => /^configure production integrations$/i.test(item)));
  assert.ok(labels.some((item) => /^the team will deploy production integrations$/i.test(item)));
  assert.ok(labels.some((item) => /^production integrations were successfully deployed$/i.test(item)));
});

test("requirement extraction splits ability and progressive passive delivery clauses", async () => {
  const service = createRequirementExtractionService(
    async () => ({
      requirements: [
        {
          text: "Knowledge of Claude API and be able to deploy production integrations.",
          category: "requirement",
          priority: "must_have"
        },
        {
          text: "Candidates should be knowledgeable about Claude API and able to deploy production integrations.",
          category: "requirement",
          priority: "must_have"
        },
        {
          text: "Knowledge of Claude API and integrations are actively being deployed.",
          category: "requirement",
          priority: "must_have"
        }
      ]
    }),
    () => true
  );

  const requirements = await service.extract("Ability and progressive passive delivery variants");
  const labels = requirements.map((item) => item.text);

  assert.equal(requirements.length, 6);
  assert.equal(labels.filter((item) => /^Knowledge of Claude API$/i.test(item)).length, 2);
  assert.ok(labels.some((item) => /^be able to deploy production integrations$/i.test(item)));
  assert.ok(labels.some((item) => /knowledgeable about Claude API$/i.test(item)));
  assert.ok(labels.some((item) => /^able to deploy production integrations$/i.test(item)));
  assert.ok(labels.some((item) => /^integrations are actively being deployed$/i.test(item)));
});

test("requirement extraction splits modal expectations", async () => {
  const service = createRequirementExtractionService(
    async () => ({
      requirements: [
        "Knowledge of Claude API and should deploy production integrations.",
        "Should deploy production integrations and knowledge of Claude API.",
        "Knowledge of Claude API and can deploy production integrations.",
        "Knowledge of Claude API and expected to deploy production integrations.",
        "Knowledge of Claude API and needs to deploy production integrations."
      ].map((text) => ({
        text,
        category: "requirement" as const,
        priority: "must_have" as const
      }))
    }),
    () => true
  );

  const requirements = await service.extract("Modal expectations");
  const labels = requirements.map((item) => item.text);

  assert.equal(requirements.length, 10);
  assert.equal(labels.filter((item) => /knowledge of Claude API/i.test(item)).length, 5);
  assert.equal(labels.filter((item) => /deploy production integrations/i.test(item)).length, 5);
  assert.ok(labels.some((item) => /^should deploy production integrations$/i.test(item)));
  assert.ok(labels.some((item) => /^can deploy production integrations$/i.test(item)));
  assert.ok(labels.some((item) => /^expected to deploy production integrations$/i.test(item)));
  assert.ok(labels.some((item) => /^needs to deploy production integrations$/i.test(item)));
});

test("requirement extraction splits multiword modal subjects and contractions", async () => {
  const service = createRequirementExtractionService(
    async () => ({
      requirements: [
        {
          text: "Knowledge of Claude API and the successful candidate will deploy production integrations.",
          category: "requirement",
          priority: "must_have"
        },
        {
          text: "Knowledge of Claude API and you'll deploy production integrations.",
          category: "requirement",
          priority: "must_have"
        },
        {
          text: "Knowledge of Claude API and you’ll deploy production integrations.",
          category: "requirement",
          priority: "must_have"
        },
        {
          text: "Knowledge of Claude API and a successful applicant will deploy production integrations.",
          category: "requirement",
          priority: "must_have"
        },
        {
          text: "Knowledge of Claude API and you are expected to deploy production integrations.",
          category: "requirement",
          priority: "must_have"
        },
        {
          text: "Knowledge of Claude API and you’d deploy production integrations.",
          category: "requirement",
          priority: "must_have"
        }
      ]
    }),
    () => true
  );

  const requirements = await service.extract("Multiword modal subjects and contractions");
  const labels = requirements.map((item) => item.text);

  assert.equal(requirements.length, 10);
  assert.equal(labels.filter((item) => /^Knowledge of Claude API$/i.test(item)).length, 5);
  assert.ok(labels.some((item) => /^the successful candidate will deploy production integrations$/i.test(item)));
  assert.ok(labels.some((item) => /^you['’]ll deploy production integrations$/i.test(item)));
  assert.ok(labels.some((item) => /^a successful applicant will deploy production integrations$/i.test(item)));
  assert.ok(labels.some((item) => /^you are expected to deploy production integrations$/i.test(item)));
  assert.ok(labels.some((item) => /^you’d deploy production integrations$/i.test(item)));
});

test("requirement extraction splits plural, pronoun, and recruiter expectation actors", async () => {
  const service = createRequirementExtractionService(
    async () => ({
      requirements: [
        "Knowledge of Claude API and successful candidates will deploy production integrations.",
        "Knowledge of Claude API and successful applicants will deploy production integrations.",
        "Knowledge of Claude API and they will deploy production integrations.",
        "Knowledge of Claude API and she will deploy production integrations.",
        "Knowledge of Claude API and you're expected to deploy production integrations.",
        "Knowledge of Claude API and the person in this role will deploy production integrations."
      ].map((text) => ({
        text,
        category: "requirement" as const,
        priority: "must_have" as const
      }))
    }),
    () => true
  );

  const requirements = await service.extract("Plural, pronoun, and recruiter expectation actors");
  const labels = requirements.map((item) => item.text);

  assert.equal(requirements.length, 12);
  assert.equal(labels.filter((item) => /^Knowledge of Claude API$/i.test(item)).length, 6);
  assert.ok(labels.some((item) => /^successful candidates will deploy production integrations$/i.test(item)));
  assert.ok(labels.some((item) => /^successful applicants will deploy production integrations$/i.test(item)));
  assert.ok(labels.some((item) => /^they will deploy production integrations$/i.test(item)));
  assert.ok(labels.some((item) => /^she will deploy production integrations$/i.test(item)));
  assert.ok(labels.some((item) => /^you're expected to deploy production integrations$/i.test(item)));
  assert.ok(labels.some((item) => /^the person in this role will deploy production integrations$/i.test(item)));
});

test("requirement extraction splits recruiter expectation clauses", async () => {
  const service = createRequirementExtractionService(
    async () => ({
      requirements: [
        {
          text: "Knowledge of Claude API and we expect you to deploy production integrations.",
          category: "requirement",
          priority: "must_have"
        },
        {
          text: "Knowledge of Claude API and the recruiter expects you to deploy production integrations.",
          category: "requirement",
          priority: "must_have"
        }
      ]
    }),
    () => true
  );

  const requirements = await service.extract("Recruiter expectation clauses");
  const labels = requirements.map((item) => item.text);

  assert.equal(requirements.length, 4);
  assert.equal(labels.filter((item) => /^Knowledge of Claude API$/i.test(item)).length, 2);
  assert.ok(labels.some((item) => /^we expect you to deploy production integrations$/i.test(item)));
  assert.ok(labels.some((item) => /^the recruiter expects you to deploy production integrations$/i.test(item)));
});

test("requirement extraction splits actor expectations and ability requirements", async () => {
  const service = createRequirementExtractionService(
    async () => ({
      requirements: [
        "Knowledge of Claude API and the successful candidate is expected to deploy production integrations.",
        "Knowledge of Claude API and candidates are expected to deploy production integrations.",
        "Knowledge of Claude API and the role holder needs to deploy production integrations.",
        "Knowledge of Claude API and the incumbent will deploy production integrations.",
        "Knowledge of Claude API and you must be able to deploy production integrations."
      ].map((text) => ({
        text,
        category: "requirement" as const,
        priority: "must_have" as const
      }))
    }),
    () => true
  );

  const requirements = await service.extract("Actor expectations and ability requirements");
  const labels = requirements.map((item) => item.text);

  assert.equal(requirements.length, 10);
  assert.equal(labels.filter((item) => /^Knowledge of Claude API$/i.test(item)).length, 5);
  assert.ok(labels.some((item) => /candidate is expected to deploy/i.test(item)));
  assert.ok(labels.some((item) => /candidates are expected to deploy/i.test(item)));
  assert.ok(labels.some((item) => /role holder needs to deploy/i.test(item)));
  assert.ok(labels.some((item) => /incumbent will deploy/i.test(item)));
  assert.ok(labels.some((item) => /you must be able to deploy/i.test(item)));
});

test("requirement extraction splits would, shall, and have-to obligations", async () => {
  const service = createRequirementExtractionService(
    async () => ({
      requirements: [
        "Knowledge of Claude API and the candidate would deploy production integrations.",
        "Knowledge of Claude API and candidates have to build production agents.",
        "Knowledge of Claude API and the role holder shall deploy production integrations."
      ].map((text) => ({
        text,
        category: "requirement" as const,
        priority: "must_have" as const
      }))
    }),
    () => true
  );

  const requirements = await service.extract("Additional actor obligations");
  const labels = requirements.map((item) => item.text);

  assert.equal(requirements.length, 6);
  assert.equal(labels.filter((item) => /^Knowledge of Claude API$/i.test(item)).length, 3);
  assert.ok(labels.some((item) => /candidate would deploy/i.test(item)));
  assert.ok(labels.some((item) => /candidates have to build/i.test(item)));
  assert.ok(labels.some((item) => /role holder shall deploy/i.test(item)));
});

test("requirement extraction preserves actor words inside relative knowledge clauses", async () => {
  const service = createRequirementExtractionService(
    async () => ({
      requirements: [
        {
          text: "Knowledge of Claude API and tools that teams can deploy securely.",
          category: "requirement",
          priority: "important"
        },
        {
          text: "Knowledge of Claude API and systems the candidate may design.",
          category: "requirement",
          priority: "important"
        }
      ]
    }),
    () => true
  );

  const requirements = await service.extract("Actor words inside relative knowledge clauses");

  assert.equal(requirements.length, 2);
  assert.equal(requirements[0]?.text, "Knowledge of Claude API and tools that teams can deploy securely.");
  assert.equal(requirements[1]?.text, "Knowledge of Claude API and systems the candidate may design.");
});

test("requirement extraction preserves passive descriptions and technical domain nouns", async () => {
  const service = createRequirementExtractionService(
    async () => ({
      requirements: [
        "Knowledge of systems that were designed to deploy models securely.",
        "Knowledge of platforms built to operate production agents.",
        "Knowledge of operating systems and Claude API.",
        "Knowledge of managed services and Claude API.",
        "Knowledge of integrated development environments and Claude API."
      ].map((text) => ({
        text,
        category: "requirement" as const,
        priority: "important" as const
      }))
    }),
    () => true
  );

  const requirements = await service.extract("Passive descriptions and technical domain nouns");

  assert.equal(requirements.length, 5);
  assert.ok(requirements.every((item) => item.category === "requirement"));
});

test("requirement extraction splits common delivery separators", async () => {
  const service = createRequirementExtractionService(
    async () => ({
      requirements: [
        "Knowledge of Claude API | deploy production integrations.",
        "Knowledge of Claude API—build production agents.",
        "Knowledge of Claude API & integrate production workflows.",
        "Knowledge of Claude API/MCP/launch production agents."
      ].map((text) => ({
        text,
        category: "requirement" as const,
        priority: "must_have" as const
      }))
    }),
    () => true
  );

  const requirements = await service.extract("Common delivery separators");
  const labels = requirements.map((item) => item.text);

  assert.equal(requirements.length, 8);
  assert.equal(labels.filter((item) => /knowledge of Claude API/i.test(item)).length, 4);
  assert.ok(labels.some((item) => /^deploy production integrations$/i.test(item)));
  assert.ok(labels.some((item) => /^build production agents$/i.test(item)));
  assert.ok(labels.some((item) => /^integrate production workflows$/i.test(item)));
  assert.ok(labels.some((item) => /^launch production agents$/i.test(item)));
});

test("requirement extraction preserves technology separators and knowledge-only modals", async () => {
  const service = createRequirementExtractionService(
    async () => ({
      requirements: [
        "Knowledge of CI/CD and ability to deploy production integrations.",
        "Knowledge of R&D platforms and ability to build production agents.",
        "Knowledge of build-operate-transfer systems.",
        "Ability to deploy CI/CD pipelines and knowledge of Claude API.",
        "Knowledge of platforms that can deploy models automatically.",
        "Knowledge of tools that may build dependency graphs."
      ].map((text) => ({
        text,
        category: "requirement" as const,
        priority: "must_have" as const
      }))
    }),
    () => true
  );

  const requirements = await service.extract("Technology separators and knowledge-only modals");
  const labels = requirements.map((item) => item.text);

  assert.ok(labels.some((item) => /^Knowledge of CI\/CD$/i.test(item)));
  assert.ok(labels.some((item) => /^Knowledge of R&D platforms$/i.test(item)));
  assert.ok(labels.some((item) => /^Knowledge of build-operate-transfer systems\.$/i.test(item)));
  assert.ok(labels.some((item) => /^Ability to deploy CI\/CD pipelines$/i.test(item)));
  assert.ok(labels.some((item) => /^Knowledge of platforms that can deploy models automatically\.$/i.test(item)));
  assert.ok(labels.some((item) => /^Knowledge of tools that may build dependency graphs\.$/i.test(item)));
});

test("requirement extraction preserves action-shaped technology knowledge domains", async () => {
  const service = createRequirementExtractionService(
    async () => ({
      requirements: [
        {
          text: "Knowledge of Claude API and design systems.",
          category: "requirement",
          priority: "important"
        },
        {
          text: "Knowledge of Claude API—build-vs-buy tradeoffs.",
          category: "requirement",
          priority: "important"
        },
        {
          text: "Knowledge of Claude API | design and architecture patterns.",
          category: "requirement",
          priority: "important"
        },
        {
          text: "Knowledge of Claude Code & design systems.",
          category: "requirement",
          priority: "important"
        },
        {
          text: "Knowledge of MCP / design systems.",
          category: "requirement",
          priority: "important"
        },
        {
          text: "Knowledge of Claude API plus design patterns.",
          category: "requirement",
          priority: "important"
        }
      ]
    }),
    () => true
  );

  const requirements = await service.extract("Action-shaped technology knowledge domains");

  assert.equal(requirements.length, 6);
  assert.equal(requirements[0]?.text, "Knowledge of Claude API and design systems.");
  assert.equal(requirements[1]?.text, "Knowledge of Claude API—build-vs-buy tradeoffs.");
  assert.equal(requirements[2]?.text, "Knowledge of Claude API | design and architecture patterns.");
  assert.equal(requirements[3]?.text, "Knowledge of Claude Code & design systems.");
  assert.equal(requirements[4]?.text, "Knowledge of MCP / design systems.");
  assert.equal(requirements[5]?.text, "Knowledge of Claude API plus design patterns.");
});

test("requirement extraction separates action-shaped domains from ownership", async () => {
  const service = createRequirementExtractionService(
    async () => ({
      requirements: [
        {
          text: "Knowledge of Claude API and design systems ownership.",
          category: "requirement",
          priority: "must_have"
        }
      ]
    }),
    () => true
  );

  const requirements = await service.extract("Action-shaped domain ownership");

  assert.equal(requirements.length, 2);
  assert.equal(requirements[0]?.text, "Knowledge of Claude API");
  assert.equal(requirements[1]?.text, "design systems ownership");
  assert.equal(requirements[1]?.category, "function");
});

test("requirement extraction distinguishes accountability from conceptual ownership language", async () => {
  const service = createRequirementExtractionService(
    async () => ({
      requirements: [
        {
          text: "Knowledge of Claude API and architecture ownership.",
          category: "requirement",
          priority: "must_have"
        },
        {
          text: "Knowledge of systems ownership models.",
          category: "requirement",
          priority: "important"
        },
        {
          text: "Knowledge of platform leadership principles.",
          category: "requirement",
          priority: "important"
        },
        {
          text: "Knowledge of product responsibility matrices.",
          category: "requirement",
          priority: "important"
        }
      ]
    }),
    () => true
  );

  const requirements = await service.extract("Accountability and conceptual ownership language");

  assert.equal(requirements.length, 5);
  assert.equal(requirements[0]?.text, "Knowledge of Claude API");
  assert.equal(requirements[1]?.text, "architecture ownership");
  assert.equal(requirements[1]?.category, "function");
  assert.match(requirements[2]?.text ?? "", /ownership models/i);
  assert.match(requirements[3]?.text ?? "", /leadership principles/i);
  assert.match(requirements[4]?.text ?? "", /responsibility matrices/i);
});

test("requirement extraction preserves qualified conceptual accountability language", async () => {
  const service = createRequirementExtractionService(
    async () => ({
      requirements: [
        "Knowledge of design system ownership maturity models.",
        "Knowledge of platform leadership competency frameworks.",
        "Knowledge of product responsibility assignment matrices."
      ].map((text) => ({
        text,
        category: "requirement" as const,
        priority: "important" as const
      }))
    }),
    () => true
  );

  const requirements = await service.extract("Qualified conceptual accountability language");

  assert.equal(requirements.length, 3);
  assert.ok(requirements.every((item) => item.category === "requirement"));
});

test("requirement extraction splits reverse recursive slash compounds at knowledge", async () => {
  const service = createRequirementExtractionService(
    async () => ({
      requirements: [
        {
          text: "Deploy production integrations / build systems / MCP / knowledge of Claude API.",
          category: "requirement",
          priority: "must_have"
        }
      ]
    }),
    () => true
  );

  const requirements = await service.extract("Reverse recursive slash compound");

  assert.equal(requirements.length, 2);
  assert.equal(requirements[0]?.text, "Deploy production integrations / build systems / MCP");
  assert.equal(requirements[1]?.text, "knowledge of Claude API");
});

test("requirement extraction preserves mixed knowledge separators before delivery", async () => {
  const service = createRequirementExtractionService(
    async () => ({
      requirements: [
        {
          text: "Knowledge of Claude API / MCP & build systems | deploy production integrations.",
          category: "requirement",
          priority: "must_have"
        },
        {
          text: "Knowledge of Claude API / MCP / build systems and ability to deploy production integrations.",
          category: "requirement",
          priority: "must_have"
        }
      ]
    }),
    () => true
  );

  const requirements = await service.extract("Mixed knowledge separators before delivery");
  const labels = requirements.map((item) => item.text);

  assert.equal(requirements.length, 4);
  assert.ok(labels.some((item) => /^Knowledge of Claude API \/ MCP & build systems$/i.test(item)));
  assert.ok(labels.some((item) => /^Knowledge of Claude API \/ MCP \/ build systems$/i.test(item)));
  assert.equal(labels.filter((item) => /deploy production integrations/i.test(item)).length, 2);
});

test("requirement extraction chooses the globally best mixed-separator split", async () => {
  const service = createRequirementExtractionService(
    async () => ({
      requirements: [
        {
          text: "Knowledge of Claude API / MCP & design systems / deploy production integrations.",
          category: "requirement",
          priority: "must_have"
        }
      ]
    }),
    () => true
  );

  const requirements = await service.extract("Globally ranked mixed separators");

  assert.equal(requirements.length, 2);
  assert.equal(requirements[0]?.text, "Knowledge of Claude API / MCP & design systems");
  assert.equal(requirements[1]?.text, "deploy production integrations");
});

test("requirement extraction preserves delivery between knowledge clauses", async () => {
  const service = createRequirementExtractionService(
    async () => ({
      requirements: [
        {
          text: "Knowledge of Claude API and deploy production integrations and familiarity with MCP.",
          category: "requirement",
          priority: "must_have"
        }
      ]
    }),
    () => true
  );

  const requirements = await service.extract("Alternating knowledge and delivery clauses");

  assert.ok(requirements.some((item) => /deploy production integrations/i.test(item.text)));
  assert.ok(
    requirements
      .filter((item) => /deploy production integrations/i.test(item.text))
      .every((item) => item.category === "function")
  );
});

test("requirement extraction keeps explicit accountability ahead of conceptual suffixes", async () => {
  const service = createRequirementExtractionService(
    async () => ({
      requirements: [
        "Knowledge of Claude API and ownership of integration frameworks.",
        "Knowledge of Claude API and leadership of architecture frameworks.",
        "Knowledge of Claude API and responsibility for platform models."
      ].map((text) => ({
        text,
        category: "requirement" as const,
        priority: "must_have" as const
      }))
    }),
    () => true
  );

  const requirements = await service.extract("Explicit accountability with conceptual nouns");
  const accountability = requirements.filter((item) => /ownership of|leadership of|responsibility for/i.test(item.text));

  assert.equal(accountability.length, 3);
  assert.ok(accountability.every((item) => item.category === "function"));
});

test("requirement extraction keeps coordinated delivery verbs self-contained", async () => {
  const service = createRequirementExtractionService(
    async () => ({
      requirements: [
        {
          text: "Knowledge of Claude API, build and deploy production agents.",
          category: "requirement",
          priority: "must_have"
        }
      ]
    }),
    () => true
  );

  const requirements = await service.extract("Coordinated delivery verbs");

  assert.equal(requirements.length, 2);
  assert.equal(requirements[0]?.text, "Knowledge of Claude API");
  assert.equal(requirements[1]?.text, "build and deploy production agents");
  assert.equal(requirements[1]?.category, "function");
  assert.ok(requirements.every((item) => !/^(?:build|deploy)$/i.test(item.text)));
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
