import type { ModelInput } from "@/types/ai";
import type { AIProviderConfig } from "@/lib/ai/provider-config";

type CompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
  error?: { message?: string };
};

type EmbeddingsResponse = {
  data?: Array<{ embedding?: number[]; index?: number }>;
  error?: { message?: string };
};

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

type CompletionInput = {
  systemPrompt: string;
  userPrompt: string;
  history?: ModelInput["history"];
  responseFormat?: { type: "json_object" };
};

export function createOpenAICompatibleProvider(fetchImpl: FetchLike = fetch) {
  async function requestCompletion(config: AIProviderConfig, input: CompletionInput): Promise<string> {
    const response = await fetchImpl(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${config.apiKey}`,
        ...config.headers
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: input.systemPrompt },
          ...(input.history ?? []).map((item) => ({ role: item.role, content: item.text })),
          { role: "user", content: input.userPrompt }
        ],
        response_format: input.responseFormat
      })
    });

    const payload = (await response.json()) as CompletionResponse;
    if (!response.ok) {
      throw new Error(payload.error?.message ?? `${config.provider} completion request failed.`);
    }

    const content = payload.choices?.[0]?.message?.content;
    if (typeof content === "string") {
      return content;
    }

    if (Array.isArray(content)) {
      const text = content
        .filter((item) => item.type === "text" && item.text)
        .map((item) => item.text)
        .join("\n")
        .trim();
      if (text) {
        return text;
      }
    }

    throw new Error(`${config.provider} response did not include content.`);
  }

  return {
    generateText(config: AIProviderConfig, input: CompletionInput) {
      return requestCompletion(config, input);
    },
    async generateJson<T>(config: AIProviderConfig, input: CompletionInput): Promise<T> {
      const text = await requestCompletion(config, {
        ...input,
        responseFormat: { type: "json_object" }
      });
      return JSON.parse(text) as T;
    },
    async embed(config: AIProviderConfig, inputs: string[]): Promise<number[][]> {
      const response = await fetchImpl(`${config.baseUrl}/embeddings`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${config.apiKey}`,
          ...config.headers
        },
        body: JSON.stringify({
          model: config.model,
          input: inputs
        })
      });

      const payload = (await response.json()) as EmbeddingsResponse;
      if (!response.ok) {
        throw new Error(payload.error?.message ?? `${config.provider} embeddings request failed.`);
      }

      const vectors = (payload.data ?? [])
        .sort((left, right) => (left.index ?? 0) - (right.index ?? 0))
        .map((item) => item.embedding ?? []);

      if (vectors.length !== inputs.length || vectors.some((vector) => vector.length === 0)) {
        throw new Error(`${config.provider} embeddings response was incomplete.`);
      }

      return vectors;
    }
  };
}
