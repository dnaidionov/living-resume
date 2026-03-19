import test from "node:test";
import assert from "node:assert/strict";
import { createOpenAICompatibleProvider } from "@/lib/ai/providers/openai-compatible";
import type { AIProviderConfig } from "@/lib/ai/provider-config";

function makeConfig(overrides: Partial<AIProviderConfig> = {}): AIProviderConfig {
  return {
    provider: "openrouter",
    compatibility: "openai",
    apiKey: "router-key",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "openai/gpt-oss-120b:free",
    headers: {
      "HTTP-Referer": "https://career-twin.example",
      "X-Title": "Career Twin"
    },
    task: "fit",
    ...overrides
  };
}

test("openai-compatible provider sends chat completion requests to provider base URL with provider headers", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const provider = createOpenAICompatibleProvider(async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify({ choices: [{ message: { content: "hello" } }] }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  });

  const answer = await provider.generateText(makeConfig(), {
    systemPrompt: "system",
    userPrompt: "user"
  });

  assert.equal(answer, "hello");
  assert.equal(calls[0]?.url, "https://openrouter.ai/api/v1/chat/completions");
  const headers = calls[0]?.init?.headers as Record<string, string>;
  assert.equal(headers.authorization, "Bearer router-key");
  assert.equal(headers["content-type"], "application/json");
  assert.equal(headers["HTTP-Referer"], "https://career-twin.example");
  assert.equal(headers["X-Title"], "Career Twin");
});

test("openai-compatible provider sends embedding requests to provider base URL", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const provider = createOpenAICompatibleProvider(async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify({ data: [{ index: 0, embedding: [0.1, 0.2] }] }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  });

  const vectors = await provider.embed(
    makeConfig({ provider: "openai", baseUrl: "https://api.openai.com/v1", model: "text-embedding-3-small" }),
    ["hello"]
  );

  assert.deepEqual(vectors, [[0.1, 0.2]]);
  assert.equal(calls[0]?.url, "https://api.openai.com/v1/embeddings");
});

test("openai-compatible provider throws when response is incomplete", async () => {
  const provider = createOpenAICompatibleProvider(async () => {
    return new Response(JSON.stringify({ data: [] }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  });

  await assert.rejects(
    provider.embed(makeConfig({ provider: "openai", baseUrl: "https://api.openai.com/v1", model: "text-embedding-3-small" }), ["hello"]),
    /incomplete/i
  );
});
