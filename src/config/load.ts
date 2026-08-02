import { resolve } from "node:path";
import { type CtxsyncConfig, defaultConfig } from "./schema.ts";

const CONFIG_FILENAMES = ["ctxsync.config.ts", "ctxsync.config.js"];

/**
 * Loads the user's ctxsync.config.ts/js from `cwd` if present, merged onto
 * defaults. Falls back to defaultConfig untouched if no config file exists.
 */
export async function loadConfig(cwd: string = process.cwd()): Promise<CtxsyncConfig> {
  for (const filename of CONFIG_FILENAMES) {
    const path = resolve(cwd, filename);
    const file = Bun.file(path);

    if (await file.exists()) {
      const mod = (await import(path)) as { default?: Partial<CtxsyncConfig> };
      const userConfig = mod.default ?? {};
      return { ...defaultConfig, ...userConfig };
    }
  }

  return defaultConfig;
}
