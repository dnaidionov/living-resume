import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { buildCloudflareDeploymentPlan } from "@/lib/deploy/cloudflare-env";

const packageJsonPath = path.join(process.cwd(), "package.json");
const deployScriptPath = path.join(process.cwd(), "scripts/cf-deploy.ts");
const wranglerConfigPath = path.join(process.cwd(), "wrangler.jsonc");
const envExamplePath = path.join(process.cwd(), ".env.example");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
  scripts?: Record<string, string>;
};
const wranglerConfig = JSON.parse(readFileSync(wranglerConfigPath, "utf8")) as {
  vars?: Record<string, string>;
};
const deployScriptSource = readFileSync(deployScriptPath, "utf8");
const envExample = readFileSync(envExamplePath, "utf8");

function makeEnv(entries: Record<string, string | undefined>) {
  return (key: string) => entries[key];
}

function parseDotEnv(source: string): Record<string, string> {
  return Object.fromEntries(
    source
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const separator = line.indexOf("=");
        return [line.slice(0, separator), line.slice(separator + 1)];
      })
  );
}

test("buildCloudflareDeploymentPlan includes routed task env and required secrets", () => {
  const plan = buildCloudflareDeploymentPlan(makeEnv({
    AI_CHAT_PROVIDER: "openrouter",
    AI_CLASSIFIER_PROVIDER: "openrouter",
    AI_FIT_PROVIDER: "openrouter",
    AI_REQUIREMENTS_PROVIDER: "openrouter",
    AI_EMBEDDINGS_PROVIDER: "openrouter",
    AI_CHAT_MODEL: "openai/gpt-5.4-nano",
    AI_CLASSIFIER_MODEL: "qwen/qwen3-next-80b-a3b-instruct:free",
    AI_FIT_MODEL: "openai/gpt-oss-120b:free",
    AI_REQUIREMENTS_MODEL: "openai/gpt-oss-120b:free",
    AI_EMBEDDING_MODEL: "openai/text-embedding-3-small",
    OPENROUTER_API_KEY: "router-key",
    OPENROUTER_BASE_URL: "https://openrouter.ai/api/v1",
    OPENROUTER_HTTP_REFERER: "https://career-twin.example",
    OPENROUTER_APP_TITLE: "Career Twin"
  }));

  assert.equal(plan.valid, true);
  assert.equal(plan.secrets.OPENAI_API_KEY, undefined);
  assert.equal(plan.secrets.OPENROUTER_API_KEY.present, true);
  assert.equal(plan.variables.AI_CHAT_PROVIDER, "openrouter");
  assert.equal(plan.variables.AI_CLASSIFIER_PROVIDER, "openrouter");
  assert.equal(plan.variables.AI_FIT_PROVIDER, "openrouter");
  assert.equal(plan.variables.AI_REQUIREMENTS_PROVIDER, "openrouter");
  assert.equal(plan.variables.AI_EMBEDDINGS_PROVIDER, "openrouter");
  assert.equal(plan.variables.AI_CHAT_MODEL, "openai/gpt-5.4-nano");
  assert.equal(plan.variables.AI_CLASSIFIER_MODEL, "qwen/qwen3-next-80b-a3b-instruct:free");
  assert.equal(plan.variables.AI_FIT_MODEL, "openai/gpt-oss-120b:free");
  assert.equal(plan.variables.AI_REQUIREMENTS_MODEL, "openai/gpt-oss-120b:free");
  assert.equal(plan.variables.AI_EMBEDDING_MODEL, "openai/text-embedding-3-small");
  assert.equal(plan.variables.OPENROUTER_HTTP_REFERER, "https://career-twin.example");
});

test("buildCloudflareDeploymentPlan flags missing OpenRouter referer when OpenRouter is used", () => {
  const plan = buildCloudflareDeploymentPlan(makeEnv({
    AI_CHAT_PROVIDER: "openrouter",
    AI_CLASSIFIER_PROVIDER: "openrouter",
    AI_FIT_PROVIDER: "openrouter",
    AI_REQUIREMENTS_PROVIDER: "openrouter",
    AI_EMBEDDINGS_PROVIDER: "openrouter",
    AI_CHAT_MODEL: "openai/gpt-5.4-nano",
    AI_CLASSIFIER_MODEL: "qwen/qwen3-next-80b-a3b-instruct:free",
    AI_FIT_MODEL: "openai/gpt-oss-120b:free",
    AI_REQUIREMENTS_MODEL: "openai/gpt-oss-120b:free",
    AI_EMBEDDING_MODEL: "openai/text-embedding-3-small",
    OPENROUTER_API_KEY: "router-key",
    OPENROUTER_APP_TITLE: "Career Twin"
  }));

  assert.equal(plan.valid, false);
  assert.match(plan.missing.join("\n"), /OPENROUTER_HTTP_REFERER/);
});

test("cf:deploy script requires explicit environment confirmation", () => {
  assert.equal(
    packageJson.scripts?.["cf:deploy"],
    "node --import tsx scripts/cf-deploy.ts"
  );
  assert.match(deployScriptSource, /--confirm-env/);
  assert.match(deployScriptSource, /Cloudflare environment configuration to deploy/);
});

test("wrangler deployment vars mirror the active runtime documented in .env.example", () => {
  const envVars = parseDotEnv(envExample);
  const expectedKeys = [
    "AI_CHAT_PROVIDER",
    "AI_CLASSIFIER_PROVIDER",
    "AI_FIT_PROVIDER",
    "AI_REQUIREMENTS_PROVIDER",
    "AI_EMBEDDINGS_PROVIDER",
    "AI_CHAT_MODEL",
    "AI_CLASSIFIER_MODEL",
    "AI_FIT_MODEL",
    "AI_REQUIREMENTS_MODEL",
    "AI_EMBEDDING_MODEL",
    "OPENROUTER_BASE_URL",
    "OPENROUTER_HTTP_REFERER",
    "OPENROUTER_APP_TITLE",
    "NEXT_PUBLIC_GA_MEASUREMENT_ID"
  ] as const;

  for (const key of expectedKeys) {
    assert.equal(
      wranglerConfig.vars?.[key],
      envVars[key],
      `${key} in wrangler.jsonc must match .env.example`
    );
  }

  assert.equal(wranglerConfig.vars?.OPENAI_BASE_URL, undefined);
});
