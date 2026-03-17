import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const layoutSource = readFileSync(path.join(process.cwd(), "app/layout.tsx"), "utf8");
const homePageSource = readFileSync(path.join(process.cwd(), "components/home-page-shell.tsx"), "utf8");
const overlaySource = readFileSync(path.join(process.cwd(), "components/ask-ai-overlay.tsx"), "utf8");
const fitFormSource = readFileSync(path.join(process.cwd(), "components/fit-analysis-form.tsx"), "utf8");
const chatShellSource = readFileSync(path.join(process.cwd(), "components/chat-shell.tsx"), "utf8");

test("page metadata uses Career Twin naming", () => {
  assert.match(layoutSource, /title:\s*"Dmitry Naidionov \| Career Twin"/);
  assert.match(
    layoutSource,
    /Career Twin for Dmitry Naidionov: a structured, evidence-based view of experience, strengths, and likely role fit\./
  );
});

test("homepage role-fit and build sections use Career Twin copy", () => {
  assert.match(homePageSource, /Use the Career Twin to compare role requirements against documented experience, outcomes,\s+and\s+adjacent evidence\./);
  assert.match(homePageSource, /The Career Twin is intentionally transparent about architecture, delivery workflow, and the role\s+each agent played in shaping the result\./);
  assert.doesNotMatch(homePageSource, /Paste a job description, upload a file, or use a job URL to compare role requirements/i);
});

test("fit-analysis panel copy mentions paste, upload, and URL intake with Career Twin framing", () => {
  assert.match(
    fitFormSource,
    /Use the Career Twin to paste a job description, upload a file, or use a job URL, then compare role\s+requirements against documented experience, outcomes, and adjacent evidence\./
  );
});

test("fit-analysis results render the checked role and company above the analysis body", () => {
  assert.match(fitFormSource, /result\.metadata\?\.targetSummary\?\.displayLabel/);
  assert.match(fitFormSource, /Role being checked/);
  assert.match(fitFormSource, /fontSize:\s*"1\.45rem"/);
});

test("chat surfaces use Career Twin naming instead of living resume", () => {
  assert.match(overlaySource, /Chat with my Career Twin/);
  assert.match(overlaySource, /Ask about experience, role fit, product judgment, or how this system was built\./);
  assert.match(chatShellSource, /Ask the Career Twin/);
  assert.doesNotMatch(overlaySource, /living resume/i);
  assert.doesNotMatch(chatShellSource, /living resume/i);
});
