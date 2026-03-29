import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  buildChatClosedDetail,
  buildChatResponseReceivedDetail,
  classifyChatPromptTopic,
  inferChatModeForAnalytics
} from "@/lib/analytics/chat";

const overlayPath = path.join(process.cwd(), "components/ask-ai-overlay.tsx");
const overlaySource = readFileSync(overlayPath, "utf8");

test("classifyChatPromptTopic maps build questions and fit requests without sending raw text", () => {
  assert.equal(classifyChatPromptTopic("How was this site built?"), "build_process");
  assert.equal(classifyChatPromptTopic("Would I be a fit for this role?"), "fit_check_request");
  assert.equal(classifyChatPromptTopic("What kind of AI-native product work is Dmitry strongest at?"), "ai_native_work");
  assert.equal(classifyChatPromptTopic("Tell me more"), "other");
});

test("inferChatModeForAnalytics keeps build questions separate from resume questions", () => {
  assert.equal(inferChatModeForAnalytics("How is this built?"), "build_process");
  assert.equal(inferChatModeForAnalytics("What experience proves strategy and execution together?"), "resume_qa");
});

test("buildChatResponseReceivedDetail includes useful timing and session metadata", () => {
  assert.deepEqual(
    buildChatResponseReceivedDetail("resume_qa", 2450, 4, false),
    {
      mode: "resume_qa",
      response_time_ms: 2450,
      response_time_bucket: "under_3s",
      message_count: 4,
      contains_link: false
    }
  );
});

test("buildChatClosedDetail buckets session duration and records whether the chat produced a response", () => {
  assert.deepEqual(
    buildChatClosedDetail(3, true, 95_000),
    {
      message_count: 3,
      had_response: true,
      session_duration_bucket: "30s_to_2m"
    }
  );
});

test("ask-ai overlay tracks open, prompt, response, handoff, close, and error analytics", () => {
  assert.match(overlaySource, /trackEvent\("chat_opened"/);
  assert.match(overlaySource, /trackEvent\("chat_prompt_clicked"/);
  assert.match(overlaySource, /trackEvent\("chat_started"/);
  assert.match(overlaySource, /"chat_response_received"/);
  assert.match(overlaySource, /trackEvent\("chat_fit_handoff_shown"/);
  assert.match(overlaySource, /trackEvent\("chat_fit_handoff_accepted"/);
  assert.match(overlaySource, /trackEvent\("chat_fit_handoff_declined"/);
  assert.match(overlaySource, /trackEvent\("chat_closed"/);
  assert.match(overlaySource, /trackEvent\("chat_error"/);
});
