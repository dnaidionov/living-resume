import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import policy from "@/tests/fixtures/live-url-eval-policy.json";

test("live job-page policy uses an explicit switch and records drift correction", () => {
  const policy = JSON.parse(readFileSync("tests/fixtures/live-url-eval-policy.json", "utf8"));
  assert.equal(typeof policy.enabled, "boolean");
  assert.match(policy.reason, /drift/i);
});

for (const script of ["scripts/run-url-evals.ts", "scripts/verify-deploy-url-evals.ts"]) {
  test(`${script} reports the pause without attempting live requests`, { skip: policy.enabled }, () => {
    const result = spawnSync(process.execPath, ["--import", "tsx", script], {
      encoding: "utf8",
      env: { ...process.env, DEPLOY_URL_EVAL_MODE: "deploy" }
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /live job-page checks paused/i);
    assert.doesNotMatch(result.stdout + result.stderr, /fetch failed|Blocked: all required/i);
  });
}
