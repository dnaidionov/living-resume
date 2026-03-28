import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { buildFitAnalysisCompletedEventDetail, buildFitAnalysisStartedEventDetail } from "@/lib/analytics/fit-analysis";
import type { FitAnalysisResult } from "@/types/ai";

const formPath = path.join(process.cwd(), "components/fit-analysis-form.tsx");
const formSource = readFileSync(formPath, "utf8");

function makeRecruiterBriefResult(): FitAnalysisResult {
  return {
    presentation: {
      mode: "recruiter_brief",
      overallMatch: {
        verdict: "probably_a_good_fit",
        label: "Probably a Good Fit"
      },
      recommendation: "Worth a recruiter screen."
    },
    internal: {
      overallSummary: "Good match.",
      overallScore: 7,
      dimensions: [],
      strengths: [],
      gaps: [],
      transferableAdvantages: [],
      interviewAngles: []
    },
    citations: [],
    confidence: "high",
    metadata: {
      evaluatorVersion: "test",
      inputKind: "url",
      presentationMode: "recruiter_brief",
      targetSummary: {
        roleTitle: "Director of Product",
        companyName: "Acme",
        displayLabel: "Director of Product at Acme"
      }
    }
  };
}

test("buildFitAnalysisStartedEventDetail tracks method and submitted url only for url input", () => {
  assert.deepEqual(
    buildFitAnalysisStartedEventDetail("url", "https://jobs.example.com/role?gh_jid=123", "2026-03-27T10:00:00.000Z"),
    {
      timestamp: "2026-03-27T10:00:00.000Z",
      input_method: "url",
      submitted_url: "https://jobs.example.com/role?gh_jid=123"
    }
  );

  assert.deepEqual(
    buildFitAnalysisStartedEventDetail("text", "https://should-not-appear.example", "2026-03-27T10:00:00.000Z"),
    {
      timestamp: "2026-03-27T10:00:00.000Z",
      input_method: "text"
    }
  );
});

test("buildFitAnalysisCompletedEventDetail tracks timestamp, method, role, company, verdict, and submitted url", () => {
  assert.deepEqual(
    buildFitAnalysisCompletedEventDetail(
      "url",
      "https://jobs.example.com/role?gh_jid=123",
      makeRecruiterBriefResult(),
      "2026-03-27T10:05:00.000Z"
    ),
    {
      timestamp: "2026-03-27T10:05:00.000Z",
      input_method: "url",
      submitted_url: "https://jobs.example.com/role?gh_jid=123",
      company: "Acme",
      role: "Director of Product",
      fit_verdict: "probably_a_good_fit"
    }
  );
});

test("buildFitAnalysisCompletedEventDetail derives verdict for scorecard mode", () => {
  const result: FitAnalysisResult = {
    presentation: {
      mode: "scorecard",
      overallSummary: "Strong match",
      overallScore: 9,
      dimensions: [],
      strengths: [],
      gaps: [],
      transferableAdvantages: [],
      interviewAngles: []
    },
    internal: {
      overallSummary: "Strong match",
      overallScore: 9,
      dimensions: [],
      strengths: [],
      gaps: [],
      transferableAdvantages: [],
      interviewAngles: []
    },
    citations: [],
    confidence: "high",
    metadata: {
      evaluatorVersion: "test",
      inputKind: "file",
      presentationMode: "scorecard",
      targetSummary: {
        roleTitle: "Staff Product Manager",
        companyName: "Motive",
        displayLabel: "Staff Product Manager at Motive"
      }
    }
  };

  assert.deepEqual(
    buildFitAnalysisCompletedEventDetail("file", "", result, "2026-03-27T10:06:00.000Z"),
    {
      timestamp: "2026-03-27T10:06:00.000Z",
      input_method: "file",
      company: "Motive",
      role: "Staff Product Manager",
      fit_verdict: "strong_fit_lets_talk"
    }
  );
});

test("fit-analysis form sends analytics payloads through trackEvent", () => {
  assert.match(formSource, /buildFitAnalysisStartedEventDetail/);
  assert.match(formSource, /buildFitAnalysisCompletedEventDetail/);
  assert.match(formSource, /trackEvent\("fit_analysis_started", buildFitAnalysisStartedEventDetail\(/);
  assert.match(formSource, /trackEvent\("fit_analysis_completed", buildFitAnalysisCompletedEventDetail\(/);
});
