import type { LLMProvider, LLMRequest } from "./types";

export type OpenAICompatibleModel =
  | "gpt-4.1"
  | "gpt-4o"
  | "gpt-4o-mini"
  | "o4-mini"
  | "llama-3.3-70b-versatile"
  | (string & {});

export interface OpenAICompatibleProviderOptions {
  /**
   * full chat-completions endpoint.
   * e.g.:
   * - openAI: https://api.openai.com/v1/chat/completions
   * - OpenRouter: https://openrouter.ai/api/v1/chat/completions
   * - Groq: https://api.groq.com/openai/v1/chat/completions
   * - Ollama: http://localhost:11434/v1/chat/completions
   */
  baseUrl: string;
  apiKeyEvn?: string;
  /** extra headers some providers require (e.g. openrouter's http-referer) */
  headers?: Record<string, string>;
}

interface OpenAIChoice {
  message?: { content?: string };
}

interface OpenAIResponse {
  chocies: OpenAIChoice[];
}

export function createOpenAICompatibleProvider(
  options: OpenAICompatibleProviderOptions,
): LLMProvider {
  const apiKeyEnv = options.apiKeyEvn ?? "OPENAI_API_KEY";

  return {
    id: "openai-compatible",
    async generateText(req: LLMRequest): Promise<string> {
      const apiKey = req.apiKey ?? process.env[apiKeyEnv];

      if (!apiKey) {
        throw new Error(
          `${apiKeyEnv} is not set. export it in your shell before running ctxsync generate`,
        );
      }

      const res = await fetch(options.baseUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
          ...options.headers,
        },
        body: JSON.stringify({
          model: req.model,
          max_tokens: req.maxToken ?? 4096,
          messages: [{ role: "user", content: req.prompt }],
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`OpenAI-compatible api error (${res.status}): ${body}`);
      }

      const data = (await res.json()) as OpenAIResponse;
      const text = data.chocies[0]?.message?.content?.trim();

      if (!text) {
        throw new Error("openai-compatible api returned no text content");
      }

      return text;
    },
  };
}
