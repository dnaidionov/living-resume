import test from "node:test";
import assert from "node:assert/strict";
import { buildDocuments, fileContentStore, loadCredentials, loadRoles } from "@/lib/content/store";

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
  const credentials = await loadCredentials();
  const documents = await buildDocuments();
  const credential = documents.find((item) => item.id === "credential-claude-certified-architect-foundations");

  assert.equal(credentials[0]?.expirationDate, "2026-12-05");
  assert.equal(credentials[0]?.featured, true);
  assert.equal(credentials[0]?.imagePath, "/claude-certified-architect-foundations.jpg");
  assert.ok(credential);
  assert.equal(credential.sourceType, "credential");
  assert.equal(credential.metadata?.expirationDate, "2026-12-05");
  assert.equal(credential.metadata?.issuer, "Anthropic");
  assert.match(credential.title, /Claude Certified Architect/);
  assert.match(credential.text, /Model Context Protocol \(MCP\)/);
  assert.doesNotMatch(credential.text, /2026-12-05|valid through|expir/i);
});
