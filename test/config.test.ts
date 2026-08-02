import { describe, expect, test } from "bun:test";
import { loadConfig } from "../src/config/load.ts";
import { defaultConfig, defineConfig } from "../src/config/schema.ts";

describe("defineConfig", () => {
  test("merges overrides onto defaults", () => {
    const config = defineConfig({ output: "CLAUDE.md" });
    expect(config.output).toBe("CLAUDE.md");
    expect(config.exclude).toEqual(defaultConfig.exclude);
  });
});

describe("loadConfig", () => {
  test("falls back to defaults when no config file exists", async () => {
    const config = await loadConfig("/tmp/ctxsync-test-no-config-here");
    expect(config).toEqual(defaultConfig);
  });
});
