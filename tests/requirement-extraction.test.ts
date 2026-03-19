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
