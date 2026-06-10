import test from "node:test";
import assert from "node:assert/strict";
import { createRequirementExtractionService } from "@/lib/ai/requirement-extraction";

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
