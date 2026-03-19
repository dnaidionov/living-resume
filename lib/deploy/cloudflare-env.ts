type ReadEnv = (key: string) => string | undefined;

export type CloudflareSecretPlan = {
  present: boolean;
};

export type CloudflareDeploymentPlan = {
  variables: Record<string, string>;
  secrets: Record<string, CloudflareSecretPlan>;
  missing: string[];
  valid: boolean;
};

function readWithFallback(readEnv: ReadEnv, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = readEnv(key)?.trim();
    if (value) {
      return value;
    }
  }
  return undefined;
}

function usesProvider(value: string | undefined, provider: string): boolean {
  return (value ?? "").trim().toLowerCase() === provider;
}

export function buildCloudflareDeploymentPlan(readEnv: ReadEnv = (key) => process.env[key]): CloudflareDeploymentPlan {
  const chatProvider = readWithFallback(readEnv, ["AI_CHAT_PROVIDER"]) ?? "openai";
  const fitProvider = readWithFallback(readEnv, ["AI_FIT_PROVIDER"]) ?? "openai";
  const requirementsProvider = readWithFallback(readEnv, ["AI_REQUIREMENTS_PROVIDER"]) ?? fitProvider;
  const embeddingsProvider = readWithFallback(readEnv, ["AI_EMBEDDINGS_PROVIDER"]) ?? "openai";

  const variables: Record<string, string> = {
    AI_CHAT_PROVIDER: chatProvider,
    AI_FIT_PROVIDER: fitProvider,
    AI_REQUIREMENTS_PROVIDER: requirementsProvider,
    AI_EMBEDDINGS_PROVIDER: embeddingsProvider,
    AI_CHAT_MODEL: readWithFallback(readEnv, ["AI_CHAT_MODEL", "OPENAI_CHAT_MODEL"]) ?? "gpt-5-mini",
    AI_FIT_MODEL: readWithFallback(readEnv, ["AI_FIT_MODEL", "OPENAI_FIT_MODEL"]) ?? "gpt-5-mini",
    AI_REQUIREMENTS_MODEL:
      readWithFallback(readEnv, ["AI_REQUIREMENTS_MODEL", "OPENAI_REQUIREMENTS_MODEL", "AI_FIT_MODEL", "OPENAI_FIT_MODEL"])
      ?? "gpt-5-mini",
    AI_EMBEDDING_MODEL: readWithFallback(readEnv, ["AI_EMBEDDING_MODEL", "OPENAI_EMBEDDING_MODEL"]) ?? "text-embedding-3-small"
  };

  const usesOpenRouter =
    usesProvider(chatProvider, "openrouter")
    || usesProvider(fitProvider, "openrouter")
    || usesProvider(requirementsProvider, "openrouter")
    || usesProvider(embeddingsProvider, "openrouter");
  const usesOpenAi =
    usesProvider(chatProvider, "openai")
    || usesProvider(fitProvider, "openai")
    || usesProvider(requirementsProvider, "openai")
    || usesProvider(embeddingsProvider, "openai");

  if (usesOpenRouter) {
    variables.OPENROUTER_BASE_URL = readWithFallback(readEnv, ["OPENROUTER_BASE_URL"]) ?? "https://openrouter.ai/api/v1";
    const referer = readWithFallback(readEnv, ["OPENROUTER_HTTP_REFERER"]);
    const appTitle = readWithFallback(readEnv, ["OPENROUTER_APP_TITLE"]) ?? "Career Twin";
    if (referer) {
      variables.OPENROUTER_HTTP_REFERER = referer;
    }
    if (appTitle) {
      variables.OPENROUTER_APP_TITLE = appTitle;
    }
  }

  const secrets: Record<string, CloudflareSecretPlan> = {};
  if (usesOpenAi) {
    secrets.OPENAI_API_KEY = {
      present: Boolean(readWithFallback(readEnv, ["OPENAI_API_KEY"]))
    };
  }
  if (usesOpenRouter) {
    secrets.OPENROUTER_API_KEY = {
      present: Boolean(readWithFallback(readEnv, ["OPENROUTER_API_KEY"]))
    };
  }

  const missing = [
    ...Object.entries(secrets)
      .filter(([, plan]) => !plan.present)
      .map(([name]) => name),
    ...(usesOpenRouter && !variables.OPENROUTER_HTTP_REFERER ? ["OPENROUTER_HTTP_REFERER"] : [])
  ];

  return {
    variables,
    secrets,
    missing,
    valid: missing.length === 0
  };
}
