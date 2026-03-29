import test from "node:test";
import assert from "node:assert/strict";
import { formatDeployUrlEvalSummary, shouldBlockDeployOnUrlEval } from "@/lib/deploy/url-eval-policy";

test("deploy url eval policy blocks only when every required case fails", () => {
  assert.equal(
    shouldBlockDeployOnUrlEval({
      totalRequired: 4,
      passedIds: [],
      failed: [{ id: "a", reason: "broken" }]
    }),
    true
  );

  assert.equal(
    shouldBlockDeployOnUrlEval({
      totalRequired: 4,
      passedIds: ["waymo"],
      failed: [{ id: "motive", reason: "unexpected title" }]
    }),
    false
  );
});

test("deploy url eval policy reports warning state when some cases are skipped", () => {
  const summary = formatDeployUrlEvalSummary({
    totalRequired: 4,
    passedIds: ["waymo", "netflix", "sourgum"],
    failed: [{ id: "motive", reason: "unexpected title" }]
  });

  assert.match(summary, /Proceeding with warnings/i);
  assert.match(summary, /3\/4/);
});
