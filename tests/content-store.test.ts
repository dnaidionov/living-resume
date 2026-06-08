import test from "node:test";
import assert from "node:assert/strict";
import { buildDocuments, fileContentStore, loadRoles } from "@/lib/content/store";

test("every role has an AI context explainer", async () => {
  const roles = await loadRoles();
  for (const role of roles) {
    if (!role.aiContextId) {
      continue;
    }
    const explainer = await fileContentStore.getAIContext(role.id);
    assert.ok(explainer, `Missing explainer for role ${role.id}`);
  }
});

test("document index is non-empty", async () => {
  const documents = await buildDocuments();
  assert.ok(documents.length > 10);
});

test("document index includes verified credential evidence", async () => {
  const documents = await buildDocuments();
  const credential = documents.find((item) => item.id === "credential-claude-certified-architect-foundations");

  assert.ok(credential);
  assert.equal(credential.sourceType, "credential");
  assert.match(credential.title, /Claude Certified Architect/);
  assert.match(credential.text, /Model Context Protocol \(MCP\)/);
});
