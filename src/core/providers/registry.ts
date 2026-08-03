import { createAnthropicProvider } from "./anthropic";
import { createOpenAICompatibleProvider } from "./openai-compatible";
import type { LLMProvider } from "./types";

export type ProviderConfig =
  | {
      type: "anthropic";
      baseUrl?: string;
      apiKeyEnv?: string;
    }
  | {
      type: "openai-compatible";
      baseUrl: string;
      apiKeyEnv?: string;
      headers?: Record<string, string>;
    };

export function createProvider(config: ProviderConfig): LLMProvider {
  switch (config.type) {
    case "anthropic":
      return createAnthropicProvider(config);
    case "openai-compatible":
      return createOpenAICompatibleProvider(config);
    default: {
      const exhaustive: never = config;
      throw new Error(`Unknown provider type: ${JSON.stringify(exhaustive)}`);
    }
  }
}
