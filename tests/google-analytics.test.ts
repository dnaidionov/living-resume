import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const componentPath = path.join(process.cwd(), "components/google-analytics.tsx");
const layoutPath = path.join(process.cwd(), "app/layout.tsx");
const envExamplePath = path.join(process.cwd(), ".env.example");

const componentSource = readFileSync(componentPath, "utf8");
const layoutSource = readFileSync(layoutPath, "utf8");
const envExampleSource = readFileSync(envExamplePath, "utf8");

test("google analytics component loads gtag only when a measurement id is configured", () => {
  assert.match(componentSource, /const measurementId = process\.env\.NEXT_PUBLIC_GA_MEASUREMENT_ID\?\.trim\(\);/);
  assert.match(componentSource, /if \(!measurementId\) \{\s*return null;\s*\}/);
  assert.match(componentSource, /https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=\$\{measurementId\}/);
  assert.match(componentSource, /gtag\('config', '\$\{measurementId\}'\)/);
});

test("google analytics component forwards app analytics events into gtag", () => {
  assert.match(componentSource, /window\.addEventListener\("living-resume:analytics", handleAnalytics\);/);
  assert.match(componentSource, /window\.gtag\("event", detail\.event, detail\);/);
  assert.match(componentSource, /window\.removeEventListener\("living-resume:analytics", handleAnalytics\);/);
});

test("root layout mounts the google analytics component once for the whole app", () => {
  assert.match(layoutSource, /import \{ GoogleAnalytics \} from "@\/components\/google-analytics";/);
  assert.match(layoutSource, /<GoogleAnalytics \/>/);
});

test("environment example documents the public GA measurement id", () => {
  assert.match(envExampleSource, /NEXT_PUBLIC_GA_MEASUREMENT_ID=/);
});
