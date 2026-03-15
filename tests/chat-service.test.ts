import test from "node:test";
import assert from "node:assert/strict";
import { resolveChatMode } from "@/lib/ai/chat-service";

test("resolveChatMode treats built/system/site questions as build-process questions", () => {
  assert.equal(
    resolveChatMode({
      message: "how this is built",
      sessionId: "test-session"
    }),
    "build_process"
  );

  assert.equal(
    resolveChatMode({
      message: "how is this system built?",
      sessionId: "test-session"
    }),
    "build_process"
  );

  assert.equal(
    resolveChatMode({
      message: "which experience best proves product strategy?",
      sessionId: "test-session"
    }),
    "resume_qa"
  );
});
