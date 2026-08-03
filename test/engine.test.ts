import { describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defaultConfig } from "../src/config/schema.ts";
import { generateContextFile } from "../src/core/engine.ts";

describe("generateContextFile", () => {
  test("scans, generates via the injected fn, and writes the output file", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ctxsync-engine-"));
    try {
      await writeFile(join(dir, "index.ts"), "export const hello = 'world';");

      const fakeGenerate = async () => "# Fake AGENTS.md content";

      const result = await generateContextFile(
        { ...defaultConfig, include: ["**/*.ts"] },
        { cwd: dir, generateFn: fakeGenerate },
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

      const fakeGenerate = async () => "# Dry run content";

      await generateContextFile(
        { ...defaultConfig, include: ["**/*.ts"] },
        { cwd: dir, generateFn: fakeGenerate, write: false },
      );

      const file = Bun.file(join(dir, defaultConfig.output));
      expect(await file.exists()).toBe(false);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
