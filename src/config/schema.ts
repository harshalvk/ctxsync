import type { AnthropicModel } from "../core/providers/anthropic";
import type { OpenAICompatibleModel } from "../core/providers/openai-compatible";
import type { ProviderConfig } from "../core/providers/registry";

type KnownModel = AnthropicModel | OpenAICompatibleModel;

export interface CtxsyncConfig {
  /** Path to the context file to generate/maintain, relative to repo root. */
  output: string;
  /** Glob patterns for files to include when scanning the repo. */
  include: string[];
  /** Glob patterns for files/dirs to exclude when scanning the repo. */
  exclude: string[];
  /** Anthropic model id used for summarization. */
  model: KnownModel;
  provider: ProviderConfig;
}

export const defaultConfig: CtxsyncConfig = {
  output: "AGENTS.md",
  include: ["**/*"],
  exclude: ["node_modules/**", "dist/**", ".git/**", "*.lock"],
  model: "claude-sonnet-4-6",
  provider: { type: "anthropic" },
};

/**
 * Typed helper for user config files, e.g. ctxsync.config.ts:
 *
 *   import { defineConfig } from "ctxsync/config";
 *   export default defineConfig({ output: "CLAUDE.md" });
 */
export function defineConfig(config: Partial<CtxsyncConfig>): CtxsyncConfig {
  return { ...defaultConfig, ...config };
}
