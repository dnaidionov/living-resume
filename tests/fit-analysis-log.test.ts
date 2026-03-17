import assert from "node:assert/strict";
import test from "node:test";
import { buildFitAnalysisLogContext } from "@/lib/logging/fit-analysis-log";
import type { FitAnalysisResult } from "@/types/ai";

test("buildFitAnalysisLogContext includes url, role, company, and recruiter brief verdict", () => {
  const result: FitAnalysisResult = {
    presentation: {
      mode: "recruiter_brief",
      overallMatch: {
        verdict: "probably_a_good_fit",
        label: "Probably a Good Fit"
      },
      recommendation: "Proceed."
    },
    internal: {
      overallSummary: "Solid fit.",
      overallScore: 7,
      dimensions: [],
      strengths: [],
      gaps: [],
      transferableAdvantages: [],
      interviewAngles: []
    },
    citations: [],
    confidence: "medium",
    metadata: {
      evaluatorVersion: "test",
      inputKind: "url",
      presentationMode: "recruiter_brief",
      targetSummary: {
        roleTitle: "Senior Product Manager",
        companyName: "Example Co",
        displayLabel: "Senior Product Manager - Example Co"
      }
    }
  };

  assert.deepEqual(
    buildFitAnalysisLogContext(
      { kind: "url", url: "https://example.com/job" },
      result,
      "recruiter_brief"
    ),
    {
      url: "https://example.com/job",
      roleName: "Senior Product Manager",
      company: "Example Co",
      fitVerdict: "probably_a_good_fit",
      inputKind: "url",
      presentationMode: "recruiter_brief"
    }
  );
});

test("buildFitAnalysisLogContext derives a verdict for scorecard mode", () => {
  const result: FitAnalysisResult = {
    presentation: {
      mode: "scorecard",
      overallSummary: "Strong.",
      overallScore: 9,
      dimensions: [],
      strengths: [],
      gaps: [],
      transferableAdvantages: [],
      interviewAngles: []
    },
    internal: {
      overallSummary: "Strong.",
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
      inputKind: "text",
      presentationMode: "scorecard"
    }
  };

  const context = buildFitAnalysisLogContext({ kind: "text", text: "Product role" }, result, "scorecard");

  assert.equal(context.url, "");
  assert.equal(context.roleName, "");
  assert.equal(context.company, "");
  assert.equal(context.fitVerdict, "strong_fit_lets_talk");
});
