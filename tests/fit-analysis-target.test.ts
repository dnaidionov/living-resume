import test from "node:test";
import assert from "node:assert/strict";
import { extractRoleTargetSummary } from "@/lib/ai/fit-analysis";

test("extractRoleTargetSummary reads title and company from a pipe-delimited posting header", () => {
  const summary = extractRoleTargetSummary(
    "Staff Product Manager, Driver Experience | San Francisco, CA | Uber\n\nAbout the role\nOwn the roadmap."
  );

  assert.deepEqual(summary, {
    roleTitle: "Staff Product Manager, Driver Experience",
    companyName: "Uber",
    displayLabel: "Staff Product Manager, Driver Experience - Uber"
  });
});

test("extractRoleTargetSummary reads company-first structured headers", () => {
  const summary = extractRoleTargetSummary(
    "Uber\nStaff Product Manager, Driver Experience\nAbout the role\nOwn the roadmap."
  );

  assert.deepEqual(summary, {
    roleTitle: "Staff Product Manager, Driver Experience",
    companyName: "Uber",
    displayLabel: "Staff Product Manager, Driver Experience - Uber"
  });
});

test("extractRoleTargetSummary returns only the role title when no defensible company is present", () => {
  const summary = extractRoleTargetSummary(
    "Staff Product Manager, Driver Experience\nAbout the role\nOwn the roadmap."
  );

  assert.deepEqual(summary, {
    roleTitle: "Staff Product Manager, Driver Experience",
    companyName: undefined,
    displayLabel: "Staff Product Manager, Driver Experience"
  });
});

test("extractRoleTargetSummary can recover company from intro paragraph when header omits it", () => {
  const summary = extractRoleTargetSummary(
    [
      "Product Manager, Driving Behaviors",
      "",
      "Product Manager, Driving Behaviors",
      "",
      "- On Site",
      "- Mountain View, California",
      "- San Francisco, California",
      "- New York City, New York",
      "- Product",
      "- Full-Time",
      "",
      "Waymo is an autonomous driving technology company with the mission to be the world's most trusted driver."
    ].join("\n")
  );

  assert.deepEqual(summary, {
    roleTitle: "Product Manager, Driving Behaviors",
    companyName: "Waymo",
    displayLabel: "Product Manager, Driving Behaviors - Waymo"
  });
});
