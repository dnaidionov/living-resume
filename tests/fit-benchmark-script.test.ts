import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const packageJsonPath = path.join(process.cwd(), "package.json");
const benchmarkScriptPath = path.join(process.cwd(), "scripts/benchmark-fit-analysis.ts");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
  scripts?: Record<string, string>;
};
const benchmarkSource = readFileSync(benchmarkScriptPath, "utf8");

test("package.json exposes a fit-analysis benchmark script", () => {
  assert.equal(
    packageJson.scripts?.["bench:fit"],
    "node --import tsx scripts/benchmark-fit-analysis.ts"
  );
});

test("fit-analysis benchmark script loads local env and reports benchmark stages", () => {
  assert.match(benchmarkSource, /loadLocalEnv\(\);/);
  assert.match(benchmarkSource, /url_fetch_first/);
  assert.match(benchmarkSource, /url_fetch_second/);
  assert.match(benchmarkSource, /useCache: false/);
  assert.match(benchmarkSource, /requirements_first/);
  assert.match(benchmarkSource, /requirements_second/);
  assert.match(benchmarkSource, /evidence_resolution/);
  assert.match(benchmarkSource, /fit_url_first/);
  assert.match(benchmarkSource, /fit_url_second/);
  assert.match(benchmarkSource, /fit_text_first/);
  assert.match(benchmarkSource, /fit_text_second/);
});

test("fit-analysis benchmark script reports active provider and model configuration", () => {
  assert.match(benchmarkSource, /chatProvider/);
  assert.match(benchmarkSource, /fitProvider/);
  assert.match(benchmarkSource, /requirementsProvider/);
  assert.match(benchmarkSource, /embeddingsProvider/);
  assert.match(benchmarkSource, /fitModel/);
  assert.match(benchmarkSource, /requirementsModel/);
});
