import { describe, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { defaultConfig } from "../src/config/schema";
import { generateContextFile } from "../src/core/engine";
import type { LLMProvider } from "../src/core/providers/types";
import { checkContextFile } from "../src/core/status";

function fakeProvider(response: string): LLMProvider {
  return { id: "fake", generateText: async () => response };
}

describe("checkContextFile", () => {
  test("returns 'missing' when the output file doesn't exist", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ctxsync-status-"));
    try {
      const result = await checkContextFile(defaultConfig, dir);
      expect(result.status).toBe("missing");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("returns 'no-cache' when the output file exists but wasn't produced by ctxsync", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ctxsync-status-"));
    try {
      await writeFile(join(dir, defaultConfig.output), "# Manually written");

      const result = await checkContextFile(defaultConfig, dir);
      expect(result.status).toBe("no-cache");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("returns 'up-to-date' right after a generate with no further changes", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ctxsync-status-"));
    try {
      await writeFile(join(dir, "index.ts"), "export const a = 1;");
      const config = { ...defaultConfig, include: ["**/*.ts"] };
      await generateContextFile(config, {
        cwd: dir,
        provider: fakeProvider("# Docs"),
      });

      const result = await checkContextFile(config, dir);
      expect(result.status).toBe("up-to-date");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("returns 'stale' with a changed count after a file changes post-generate", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ctxsync-status-"));
    try {
      await writeFile(join(dir, "index.ts"), "export const a = 1;");
      const config = { ...defaultConfig, include: ["**/*.ts"] };
      await generateContextFile(config, {
        cwd: dir,
        provider: fakeProvider("# Docs"),
      });

      await writeFile(join(dir, "index.ts"), "export const a = 2;");

      const result = await checkContextFile(config, dir);
      expect(result.status).toBe("stale");
      if (result.status === "stale") {
        expect(result.changedCount).toBe(1);
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
