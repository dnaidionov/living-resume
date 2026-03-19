import test from "node:test";
import assert from "node:assert/strict";
import {
  createProviderConfigResolver,
  resolveProviderConfig,
  sanitizeProviderEnvKey,
  type ProviderTask
} from "@/lib/ai/provider-config";

function makeEnv(entries: Record<string, string | undefined>) {
  return (key: string) => entries[key];
}

test("resolveProviderConfig preserves current OpenAI defaults when generic AI vars are unset", () => {
  const resolver = createProviderConfigResolver(makeEnv({
    OPENAI_API_KEY: "openai-key",
    OPENAI_CHAT_MODEL: "gpt-5-mini",
    OPENAI_FIT_MODEL: "gpt-5-pro",
    OPENAI_EMBEDDING_MODEL: "text-embedding-3-small"
  }));

  const chat = resolver("chat");
  const fit = resolver("fit");
  const requirements = resolver("requirements");
  const embeddings = resolver("embeddings");

  assert.equal(chat.provider, "openai");
  assert.equal(chat.model, "gpt-5-mini");
  assert.equal(chat.baseUrl, "https://api.openai.com/v1");
  assert.equal(chat.apiKey, "openai-key");

  assert.equal(fit.provider, "openai");
  assert.equal(fit.model, "gpt-5-pro");

  assert.equal(requirements.provider, "openai");
  assert.equal(requirements.model, "gpt-5-pro");

  assert.equal(embeddings.provider, "openai");
  assert.equal(embeddings.model, "text-embedding-3-small");
});

test("resolveProviderConfig routes a task to OpenRouter with provider-specific headers", () => {
  const resolver = createProviderConfigResolver(makeEnv({
    AI_FIT_PROVIDER: "openrouter",
    AI_FIT_MODEL: "openai/gpt-oss-120b:free",
    OPENROUTER_API_KEY: "router-key",
    OPENROUTER_HTTP_REFERER: "https://career-twin.example",
    OPENROUTER_APP_TITLE: "Career Twin"
  }));

  const fit = resolver("fit");

  assert.equal(fit.provider, "openrouter");
  assert.equal(fit.model, "openai/gpt-oss-120b:free");
  assert.equal(fit.baseUrl, "https://openrouter.ai/api/v1");
  assert.equal(fit.apiKey, "router-key");
  assert.equal(fit.headers["HTTP-Referer"], "https://career-twin.example");
  assert.equal(fit.headers["X-Title"], "Career Twin");
});

test("resolveProviderConfig supports custom OpenAI-compatible providers via namespaced env vars", () => {
  const resolver = createProviderConfigResolver(makeEnv({
    AI_REQUIREMENTS_PROVIDER: "groq",
    AI_REQUIREMENTS_MODEL: "llama-3.3-70b-versatile",
    AI_PROVIDER_GROQ_API_KEY: "groq-key",
    AI_PROVIDER_GROQ_BASE_URL: "https://api.groq.com/openai/v1",
    AI_PROVIDER_GROQ_COMPATIBILITY: "openai"
  }));

  const requirements = resolver("requirements");

  assert.equal(requirements.provider, "groq");
  assert.equal(requirements.model, "llama-3.3-70b-versatile");
  assert.equal(requirements.baseUrl, "https://api.groq.com/openai/v1");
  assert.equal(requirements.apiKey, "groq-key");
  assert.equal(requirements.compatibility, "openai");
});

test("resolveProviderConfig falls back to task-specific model inheritance for generic AI vars", () => {
  const resolver = createProviderConfigResolver(makeEnv({
    AI_FIT_PROVIDER: "openrouter",
    AI_FIT_MODEL: "qwen/qwen3-next-80b-a3b-instruct:free",
    OPENROUTER_API_KEY: "router-key"
  }));

  const requirements = resolver("requirements");

  assert.equal(requirements.provider, "openrouter");
  assert.equal(requirements.model, "qwen/qwen3-next-80b-a3b-instruct:free");
});

test("resolveProviderConfig throws for unsupported custom provider compatibility", () => {
  const resolver = createProviderConfigResolver(makeEnv({
    AI_CHAT_PROVIDER: "custom-anthropic",
    AI_CHAT_MODEL: "claude-sonnet",
    AI_PROVIDER_CUSTOM_ANTHROPIC_API_KEY: "anthropic-key",
    AI_PROVIDER_CUSTOM_ANTHROPIC_BASE_URL: "https://api.anthropic.com/v1",
    AI_PROVIDER_CUSTOM_ANTHROPIC_COMPATIBILITY: "anthropic"
  }));

  assert.throws(() => resolver("chat"), /Unsupported AI provider compatibility/);
});

test("resolveProviderConfig throws when provider credentials are missing", () => {
  const resolver = createProviderConfigResolver(makeEnv({
    AI_FIT_PROVIDER: "openrouter",
    AI_FIT_MODEL: "openai/gpt-oss-120b:free"
  }));

  assert.throws(() => resolver("fit"), /Missing API key/);
});

test("sanitizeProviderEnvKey normalizes provider identifiers for custom env lookup", () => {
  assert.equal(sanitizeProviderEnvKey("openrouter"), "OPENROUTER");
  assert.equal(sanitizeProviderEnvKey("custom-openai.compat"), "CUSTOM_OPENAI_COMPAT");
});

test("resolveProviderConfig helper uses process env by default", () => {
  process.env.AI_CHAT_PROVIDER = "openai";
  process.env.OPENAI_API_KEY = "openai-key";
  process.env.OPENAI_CHAT_MODEL = "gpt-5-mini";

  try {
    const config = resolveProviderConfig("chat");
    assert.equal(config.provider, "openai");
    assert.equal(config.model, "gpt-5-mini");
  } finally {
    delete process.env.AI_CHAT_PROVIDER;
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_CHAT_MODEL;
  }
});

