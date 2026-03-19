import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { buildCloudflareDeploymentPlan } from "@/lib/deploy/cloudflare-env";

const packageJsonPath = path.join(process.cwd(), "package.json");
const deployScriptPath = path.join(process.cwd(), "scripts/cf-deploy.ts");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
  scripts?: Record<string, string>;
};
const deployScriptSource = readFileSync(deployScriptPath, "utf8");

function makeEnv(entries: Record<string, string | undefined>) {
  return (key: string) => entries[key];
}

test("buildCloudflareDeploymentPlan includes routed task env and required secrets", () => {
  const plan = buildCloudflareDeploymentPlan(makeEnv({
    AI_CHAT_PROVIDER: "openai",
    AI_FIT_PROVIDER: "openrouter",
    AI_REQUIREMENTS_PROVIDER: "openrouter",
    AI_EMBEDDINGS_PROVIDER: "openai",
    AI_CHAT_MODEL: "gpt-5-mini",
    AI_FIT_MODEL: "openai/gpt-oss-120b:free",
    AI_REQUIREMENTS_MODEL: "openai/gpt-oss-120b:free",
    AI_EMBEDDING_MODEL: "text-embedding-3-small",
    OPENAI_API_KEY: "openai-key",
    OPENROUTER_API_KEY: "router-key",
    OPENROUTER_BASE_URL: "https://openrouter.ai/api/v1",
    OPENROUTER_HTTP_REFERER: "https://career-twin.example",
    OPENROUTER_APP_TITLE: "Career Twin"
  }));

  assert.equal(plan.valid, true);
  assert.equal(plan.secrets.OPENAI_API_KEY.present, true);
  assert.equal(plan.secrets.OPENROUTER_API_KEY.present, true);
  assert.equal(plan.variables.AI_FIT_PROVIDER, "openrouter");
  assert.equal(plan.variables.AI_REQUIREMENTS_MODEL, "openai/gpt-oss-120b:free");
  assert.equal(plan.variables.OPENROUTER_HTTP_REFERER, "https://career-twin.example");
});

test("buildCloudflareDeploymentPlan flags missing OpenRouter referer when OpenRouter is used", () => {
  const plan = buildCloudflareDeploymentPlan(makeEnv({
    AI_CHAT_PROVIDER: "openai",
    AI_FIT_PROVIDER: "openrouter",
    AI_REQUIREMENTS_PROVIDER: "openrouter",
    AI_EMBEDDINGS_PROVIDER: "openai",
    AI_CHAT_MODEL: "gpt-5-mini",
    AI_FIT_MODEL: "openai/gpt-oss-120b:free",
    AI_REQUIREMENTS_MODEL: "openai/gpt-oss-120b:free",
    AI_EMBEDDING_MODEL: "text-embedding-3-small",
    OPENAI_API_KEY: "openai-key",
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
