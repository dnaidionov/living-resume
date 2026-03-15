import test from "node:test";
import assert from "node:assert/strict";
import { normalizeChatText } from "@/lib/chat-format";

test("normalizeChatText trims surrounding whitespace and removes empty lines", () => {
  assert.equal(
    normalizeChatText("\n\nFirst line.\n\n\nSecond line.\n\n"),
    "First line.\nSecond line."
  );
});

test("normalizeChatText preserves single line breaks", () => {
  assert.equal(normalizeChatText("Line one.\nLine two."), "Line one.\nLine two.");
});
