import type { CtxsyncConfig } from "../config/schema.ts";

/**
 * Returns config.exclude plus the output file and .ctxsync/ cache dir.
 * Without this, generate/check would see their own writes (the generated
 * AGENTS.md and the cache file) as changed files on the next scan — a
 * self-referential bug where the tool's own output looked like drift.
 */
export function getEffectiveExclude(config: CtxsyncConfig): string[] {
  return [...config.exclude, config.output, ".ctxsync/**"];
}
