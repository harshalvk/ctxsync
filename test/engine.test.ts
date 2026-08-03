import { describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defaultConfig } from "../src/config/schema.ts";
import { generateContextFile } from "../src/core/engine.ts";
import type { LLMProvider } from "../src/core/providers/types.ts";

function fakeProvider(response: string): LLMProvider {
  return {
    id: "fake",
    generateText: async () => response,
  };
}

describe("generateContextFile", () => {
  test("scans, generates via the injected provider, and writes the output file", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ctxsync-engine-"));
    try {
      await writeFile(join(dir, "index.ts"), "export const hello = 'world';");

      const result = await generateContextFile(
        { ...defaultConfig, include: ["**/*.ts"] },
        { cwd: dir, provider: fakeProvider("# Fake AGENTS.md content") },
      );

      expect(result.filesScanned).toBe(1);
      expect(result.content).toBe("# Fake AGENTS.md content");

      const written = await readFile(join(dir, defaultConfig.output), "utf-8");
      expect(written).toBe("# Fake AGENTS.md content");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("does not write to disk when write: false", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ctxsync-engine-"));
    try {
      await writeFile(join(dir, "index.ts"), "export const hello = 'world';");

      await generateContextFile(
        { ...defaultConfig, include: ["**/*.ts"] },
        { cwd: dir, provider: fakeProvider("# Dry run content"), write: false },
      );

      const file = Bun.file(join(dir, defaultConfig.output));
      expect(await file.exists()).toBe(false);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
