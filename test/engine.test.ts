import { describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defaultConfig } from "../src/config/schema.ts";
import { generateContextFile } from "../src/core/engine.ts";
import type { LLMProvider } from "../src/core/providers/types.ts";

function countingProvider(response: string): {
  provider: LLMProvider;
  callCount: () => number;
} {
  let calls = 0;
  return {
    provider: {
      id: "fake",
      generateText: async () => {
        calls += 1;
        return response;
      },
    },
    callCount: () => calls,
  };
}

describe("generateContextFile", () => {
  test("first run with no cache does a full generation", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ctxsync-engine-"));
    try {
      await writeFile(join(dir, "index.ts"), "export const hello = 'world';");
      const { provider } = countingProvider("# Fake AGENTS.md content");

      const result = await generateContextFile(
        { ...defaultConfig, include: ["**/*.ts"] },
        { cwd: dir, provider },
      );

      expect(result.mode).toBe("full");
      expect(result.filesScanned).toBe(1);

      const written = await readFile(join(dir, defaultConfig.output), "utf-8");
      expect(written).toBe("# Fake AGENTS.md content");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("does not write to disk or cache when write: false", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ctxsync-engine-"));
    try {
      await writeFile(join(dir, "index.ts"), "export const hello = 'world';");
      const { provider } = countingProvider("# Dry run content");

      await generateContextFile(
        { ...defaultConfig, include: ["**/*.ts"] },
        { cwd: dir, provider, write: false },
      );

      const outputExists = await Bun.file(join(dir, defaultConfig.output)).exists();
      const cacheExists = await Bun.file(join(dir, ".ctxsync/cache.json")).exists();
      expect(outputExists).toBe(false);
      expect(cacheExists).toBe(false);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("second run with no file changes skips the LLM call entirely", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ctxsync-engine-"));
    try {
      await writeFile(join(dir, "index.ts"), "export const hello = 'world';");
      const { provider, callCount } = countingProvider("# Content");
      const config = { ...defaultConfig, include: ["**/*.ts"] };

      await generateContextFile(config, { cwd: dir, provider });
      expect(callCount()).toBe(1);

      const result = await generateContextFile(config, { cwd: dir, provider });
      expect(result.mode).toBe("skipped");
      expect(callCount()).toBe(1); // no second LLM call
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("run after a file changes triggers an incremental update", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ctxsync-engine-"));
    try {
      await writeFile(join(dir, "index.ts"), "export const hello = 'world';");
      const { provider: provider1 } = countingProvider("# v1");
      const config = { ...defaultConfig, include: ["**/*.ts"] };

      await generateContextFile(config, { cwd: dir, provider: provider1 });

      await writeFile(join(dir, "index.ts"), "export const hello = 'changed';");
      const { provider: provider2 } = countingProvider("# v2 updated");

      const result = await generateContextFile(config, {
        cwd: dir,
        provider: provider2,
      });
      expect(result.mode).toBe("incremental");

      const written = await readFile(join(dir, defaultConfig.output), "utf-8");
      expect(written).toBe("# v2 updated");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("force: true ignores the cache and does a full regeneration", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ctxsync-engine-"));
    try {
      await writeFile(join(dir, "index.ts"), "export const hello = 'world';");
      const { provider: provider1 } = countingProvider("# v1");
      const config = { ...defaultConfig, include: ["**/*.ts"] };

      await generateContextFile(config, { cwd: dir, provider: provider1 });

      const { provider: provider2, callCount } = countingProvider("# forced full regen");
      const result = await generateContextFile(config, {
        cwd: dir,
        provider: provider2,
        force: true,
      });

      expect(result.mode).toBe("full");
      expect(callCount()).toBe(1);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
