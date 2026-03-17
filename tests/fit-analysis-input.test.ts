import test from "node:test";
import assert from "node:assert/strict";
import { resolveRoleInputForAnalysis } from "@/lib/ai/fit-analysis-input";
import type { RoleInput } from "@/types/ai";

test("resolveRoleInputForAnalysis expands URL input with fetched content and target summary", async () => {
  const input: RoleInput = {
    kind: "url",
    url: "https://careers.withwaymo.com/jobs/product-manager-driving-behaviors"
  };

  const resolved = await resolveRoleInputForAnalysis(input, async () => ({
    content: "Product Manager, Driving Behaviors\n\nWaymo is an autonomous driving technology company.",
    targetSummary: {
      roleTitle: "Product Manager, Driving Behaviors",
      companyName: "Waymo",
      displayLabel: "Product Manager, Driving Behaviors - Waymo"
    }
  }));

  assert.deepEqual(resolved, {
    kind: "url",
    url: "https://careers.withwaymo.com/jobs/product-manager-driving-behaviors",
    content: "Product Manager, Driving Behaviors\n\nWaymo is an autonomous driving technology company.",
    targetSummary: {
      roleTitle: "Product Manager, Driving Behaviors",
      companyName: "Waymo",
      displayLabel: "Product Manager, Driving Behaviors - Waymo"
    }
  });
});

test("resolveRoleInputForAnalysis leaves non-URL input unchanged and does not call fetch", async () => {
  const input: RoleInput = {
    kind: "text",
    text: "Head of Product"
  };

  let called = false;
  const resolved = await resolveRoleInputForAnalysis(input, async () => {
    called = true;
    return {
      content: "unexpected"
    };
  });

  assert.equal(called, false);
  assert.deepEqual(resolved, input);
});
