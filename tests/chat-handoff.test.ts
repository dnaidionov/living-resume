import test from "node:test";
import assert from "node:assert/strict";
import {
  extractFitCheckTarget,
  isAffirmativeFitHandoffReply,
  isNegativeFitHandoffReply
} from "@/lib/chat-handoff";

test("extractFitCheckTarget returns a URL target for fit-check requests with a job link", () => {
  const target = extractFitCheckTarget(
    "can you run the resume fit check for me? https://jobs.ashbyhq.com/sourgum/a8720ec5-99e8-4aa8-b8da-07aa0afa5be6"
  );

  assert.deepEqual(target, {
    kind: "url",
    value: "https://jobs.ashbyhq.com/sourgum/a8720ec5-99e8-4aa8-b8da-07aa0afa5be6"
  });
});

test("extractFitCheckTarget recognizes good-fit phrasing with a job URL", () => {
  const target = extractFitCheckTarget(
    "is Dmitry a good fit for this role https://jobs.ashbyhq.com/sourgum/a8720ec5-99e8-4aa8-b8da-07aa0afa5be6?utm_source=VjydAOXMeB"
  );

  assert.deepEqual(target, {
    kind: "url",
    value: "https://jobs.ashbyhq.com/sourgum/a8720ec5-99e8-4aa8-b8da-07aa0afa5be6?utm_source=VjydAOXMeB"
  });
});

test("extractFitCheckTarget returns pasted JD text when the request includes a job description body", () => {
  const target = extractFitCheckTarget(`Please run a fit analysis on this JD:
Senior Product Manager
Own roadmap strategy and stakeholder alignment for a SaaS platform.
Lead discovery, requirements, backlog prioritization, and delivery with engineering.`);

  assert.deepEqual(target, {
    kind: "text",
    value:
      "Senior Product Manager\nOwn roadmap strategy and stakeholder alignment for a SaaS platform.\nLead discovery, requirements, backlog prioritization, and delivery with engineering."
  });
});

test("extractFitCheckTarget ignores non-fit chat questions", () => {
  assert.equal(extractFitCheckTarget("Which experience best proves product strategy and execution together?"), null);
});

test("fit-check handoff reply detection recognizes yes and no answers", () => {
  assert.equal(isAffirmativeFitHandoffReply("yes"), true);
  assert.equal(isAffirmativeFitHandoffReply("sure, do it"), true);
  assert.equal(isNegativeFitHandoffReply("no"), true);
  assert.equal(isNegativeFitHandoffReply("not now"), true);
  assert.equal(isAffirmativeFitHandoffReply("maybe later"), false);
  assert.equal(isNegativeFitHandoffReply("tell me more"), false);
});
