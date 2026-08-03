import type { LLMProvider, LLMRequest } from "./types";

export type AnthropicModel =
  | "claude-opus-4-8"
  | "claude-sonnet-5"
  | "claude-haiku-4-5-20251001"
  | (string & {});

export interface AnthropicProviderOptions {
  baseUrl?: string;
  apiKeyEnv?: string;
}

interface AnthropicContentBlock {
  type: string;
  text?: string;
}

interface AnthropicResponse {
  content: AnthropicContentBlock[];
}

export function createAnthropicProvider(options: AnthropicProviderOptions = {}): LLMProvider {
  const baseUrl = options.baseUrl ?? "https://api.anthropic.com/v1/messages";
  const apiKeyEnv = options.apiKeyEnv ?? "ANTHROPIC_API_KEY";

  return {
    id: "anthropic",
    async generateText(req: LLMRequest): Promise<string> {
      const apiKey = req.apiKey ?? process.env[apiKeyEnv];

      if (!apiKey) {
        throw new Error(
          `${apiKeyEnv} is not set. export it in you shell before running ctxsync generate`,
        );
      }

      const res = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: req.model,
          max_tokens: req.maxToken ?? 4096,
          messages: [{ role: "user", content: req.prompt }],
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Anthropic api error (${res.status}): ${body}`);
      }

      const data = (await res.json()) as AnthropicResponse;

      const text = data.content
        .filter((block) => block.type === "text")
        .map((block) => block.text ?? "")
        .join("\n")
        .trim();

      if (!text) {
        throw new Error("anthropic api returned no text content");
      }

      return text;
    },
  };
}
