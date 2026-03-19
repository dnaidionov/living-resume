import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const overlayPath = path.join(process.cwd(), "components/ask-ai-overlay.tsx");
const overlaySource = readFileSync(overlayPath, "utf8");

test("ask-ai overlay sends on Cmd+Enter or Ctrl+Enter", () => {
  assert.match(overlaySource, /onKeyDown=\{\(event\) => \{/);
  assert.match(overlaySource, /\(event\.metaKey \|\| event\.ctrlKey\) && event\.key === "Enter"/);
  assert.match(overlaySource, /event\.preventDefault\(\);/);
  assert.match(overlaySource, /void sendMessage\(message\);/);
});

test("ask-ai overlay keeps plain Enter available for multiline input", () => {
  assert.doesNotMatch(overlaySource, /if\s*\(\s*event\.key === "Enter"/);
});

test("ask-ai overlay anchors chat content to the bottom of the scroll rail", () => {
  assert.match(overlaySource, /minHeight:\s*0/);
  assert.match(overlaySource, /overscrollBehavior:\s*"contain"/);
  assert.match(overlaySource, /minHeight:\s*"100%"/);
  assert.match(overlaySource, /justifyContent:\s*"flex-end"/);
});

test("ask-ai overlay aligns user messages right and assistant messages left", () => {
  assert.match(overlaySource, /justifyContent:\s*item\.role === "user" \? "flex-end" : "flex-start"/);
  assert.match(overlaySource, /width:\s*"100%"/);
  assert.match(overlaySource, /width:\s*"fit-content"/);
  assert.match(overlaySource, /justifyContent:\s*"flex-start"/);
});

test("ask-ai overlay uses a typing indicator instead of a Thinking bubble", () => {
  assert.match(overlaySource, /className="typing-indicator"/);
  assert.doesNotMatch(overlaySource, />\s*Thinking\.\.\.\s*</);
});

test("ask-ai overlay keeps the composer focused while chat stays open", () => {
  assert.match(overlaySource, /const focusComposer = useCallback\(\(\) => \{/);
  assert.match(overlaySource, /requestAnimationFrame\(\(\) => \{\s*textareaRef\.current\?\.focus\(\);/);
  assert.match(overlaySource, /useEffect\(\(\) => \{\s*focusComposer\(\);\s*\}, \[focusComposer\]\);/);
  assert.match(overlaySource, /useEffect\(\(\) => \{\s*if \(loading\) \{\s*return;\s*}\s*focusComposer\(\);\s*\}, \[focusComposer, messages, loading\]\);/);
});

test("ask-ai overlay supports fit-check handoff into the dedicated flow", () => {
  assert.match(overlaySource, /onStartFitCheck:/);
  assert.match(overlaySource, /extractFitCheckTarget/);
  assert.match(overlaySource, /function handleFitHandoffAccept\(\)/);
  assert.match(overlaySource, /function handleFitHandoffDecline\(\)/);
  assert.match(overlaySource, /There’s a separate fit-check flow for that\./);
  assert.match(overlaySource, /Sure, let’s go/);
  assert.match(overlaySource, /No, stay here/);
  assert.match(overlaySource, /Ok, staying here\./);
  assert.match(overlaySource, /padding:\s*"6px 12px"/);
  assert.match(overlaySource, /minHeight:\s*34/);
  assert.match(overlaySource, /onClick=\{\(\) => \{\s*handleFitHandoffAccept\(\);/);
  assert.match(overlaySource, /onClick=\{\(\) => \{\s*handleFitHandoffDecline\(\);/);
});

test("ask-ai overlay renders assistant URLs as clickable links", () => {
  assert.match(overlaySource, /function renderMessageContent\(text: string\)/);
  assert.match(overlaySource, /href=\{url\}/);
  assert.match(overlaySource, /target="_blank"/);
  assert.match(overlaySource, /rel="noreferrer"/);
  assert.match(overlaySource, /item\.role === "assistant" \? renderMessageContent\(item\.text\) : item\.text/);
});

test("ask-ai overlay keeps trailing punctuation outside clickable URLs", () => {
  assert.match(overlaySource, /function splitTrailingPunctuation\(value: string\)/);
  assert.match(overlaySource, /const trimmed = value\.match\(\/\[\.,!\?:;]\+\$\/\)/);
  assert.match(overlaySource, /href=\{url\}/);
  assert.match(overlaySource, /\{trailing\}/);
});
