export interface CtxsyncConfig {
  /** Path to the context file to generate/maintain, relative to repo root. */
  output: string;
  /** Glob patterns for files to include when scanning the repo. */
  include: string[];
  /** Glob patterns for files/dirs to exclude when scanning the repo. */
  exclude: string[];
  /** Anthropic model id used for summarization. */
  model: string;
}

export const defaultConfig: CtxsyncConfig = {
  output: "AGENTS.md",
  include: ["**/*"],
  exclude: ["node_modules/**", "dist/**", ".git/**", "*.lock"],
  model: "claude-sonnet-4-6",
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
