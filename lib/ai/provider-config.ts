export type ProviderTask = "chat" | "fit" | "requirements" | "embeddings";
export type AIProviderCompatibility = "openai";
export type AIProviderConfig = {
  task: ProviderTask;
  provider: string;
  compatibility: AIProviderCompatibility;
  apiKey: string;
  baseUrl: string;
  model: string;
  headers: Record<string, string>;
};

export type AIProviderSummary = {
  provider: string;
  model: string;
};

type EnvReader = (key: string) => string | undefined;

type ProviderPreset = {
  compatibility: AIProviderCompatibility;
  apiKeyEnv: string;
  baseUrlEnv?: string;
  defaultBaseUrl: string;
  headers?: (readEnv: EnvReader) => Record<string, string>;
};

const providerPresets: Record<string, ProviderPreset> = {
  openai: {
    compatibility: "openai",
    apiKeyEnv: "OPENAI_API_KEY",
    baseUrlEnv: "OPENAI_BASE_URL",
    defaultBaseUrl: "https://api.openai.com/v1"
  },
  openrouter: {
    compatibility: "openai",
    apiKeyEnv: "OPENROUTER_API_KEY",
    baseUrlEnv: "OPENROUTER_BASE_URL",
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    headers: (readEnv) => {
      const headers: Record<string, string> = {};
      const referer = readEnv("OPENROUTER_HTTP_REFERER");
      const title = readEnv("OPENROUTER_APP_TITLE");
      if (referer) {
        headers["HTTP-Referer"] = referer;
      }
      if (title) {
        headers["X-Title"] = title;
      }
      return headers;
    }
  }
};

export function sanitizeProviderEnvKey(provider: string): string {
  return provider.trim().replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").toUpperCase();
}

function resolveProviderName(task: ProviderTask, readEnv: EnvReader): string {
  const taskProvider = readEnv(providerEnvKey(task))?.trim();
  if (taskProvider) {
    return taskProvider;
  }

  if (task === "requirements") {
    return readEnv("AI_FIT_PROVIDER")?.trim() || "openai";
  }

  return "openai";
}

function modelEnvKey(task: ProviderTask): string {
  switch (task) {
    case "chat":
      return "AI_CHAT_MODEL";
    case "fit":
      return "AI_FIT_MODEL";
    case "requirements":
      return "AI_REQUIREMENTS_MODEL";
    case "embeddings":
      return "AI_EMBEDDING_MODEL";
  }
}

function providerEnvKey(task: ProviderTask): string {
  switch (task) {
    case "chat":
      return "AI_CHAT_PROVIDER";
    case "fit":
      return "AI_FIT_PROVIDER";
    case "requirements":
      return "AI_REQUIREMENTS_PROVIDER";
    case "embeddings":
      return "AI_EMBEDDINGS_PROVIDER";
  }
}

function resolveModel(task: ProviderTask, readEnv: EnvReader): string {
  const genericTaskModel = readEnv(modelEnvKey(task));
  if (genericTaskModel) {
    return genericTaskModel;
  }

  switch (task) {
    case "chat":
      return readEnv("OPENAI_CHAT_MODEL") ?? "gpt-5-mini";
    case "fit":
      return readEnv("OPENAI_FIT_MODEL") ?? readEnv("OPENAI_CHAT_MODEL") ?? "gpt-5-mini";
    case "requirements":
      return readEnv("AI_FIT_MODEL")
        ?? readEnv("OPENAI_REQUIREMENTS_MODEL")
        ?? readEnv("OPENAI_FIT_MODEL")
        ?? readEnv("OPENAI_CHAT_MODEL")
        ?? "gpt-5-mini";
    case "embeddings":
      return readEnv("OPENAI_EMBEDDING_MODEL") ?? "text-embedding-3-small";
  }
}

function resolveCustomProvider(provider: string, readEnv: EnvReader): ProviderPreset {
  const envKey = sanitizeProviderEnvKey(provider);
  const compatibility = readEnv(`AI_PROVIDER_${envKey}_COMPATIBILITY`) ?? "openai";
  if (compatibility !== "openai") {
    throw new Error(`Unsupported AI provider compatibility: ${compatibility}`);
  }

  return {
    compatibility,
    apiKeyEnv: `AI_PROVIDER_${envKey}_API_KEY`,
    baseUrlEnv: `AI_PROVIDER_${envKey}_BASE_URL`,
    defaultBaseUrl: ""
  };
}

export function createProviderConfigResolver(readEnv: EnvReader) {
  return (task: ProviderTask): AIProviderConfig => {
    const provider = resolveProviderName(task, readEnv);
    const preset = providerPresets[provider] ?? resolveCustomProvider(provider, readEnv);
    const apiKey = readEnv(preset.apiKeyEnv);
    if (!apiKey) {
      throw new Error(`Missing API key for AI provider \"${provider}\".`);
    }

    const baseUrl = (preset.baseUrlEnv ? readEnv(preset.baseUrlEnv) : undefined) ?? preset.defaultBaseUrl;
    if (!baseUrl) {
      throw new Error(`Missing base URL for AI provider \"${provider}\".`);
    }

    return {
      task,
      provider,
      compatibility: preset.compatibility,
      apiKey,
      baseUrl,
      model: resolveModel(task, readEnv),
      headers: preset.headers ? preset.headers(readEnv) : {}
    };
  };
}

export function resolveProviderConfig(task: ProviderTask): AIProviderConfig {
  const resolver = createProviderConfigResolver((key) => process.env[key]);
  return resolver(task);
}

export function hasProviderConfig(task: ProviderTask): boolean {
  try {
    resolveProviderConfig(task);
    return true;
  } catch {
    return false;
  }
}

export function readProviderSummary(task: ProviderTask): AIProviderSummary {
  const config = resolveProviderConfig(task);
  return {
    provider: config.provider,
    model: config.model
  };
}
