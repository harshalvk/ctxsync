import { describe, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { watchRepo } from "../src/core/watch";

describe("watchRepo", () => {
  test("ignores changes matching ignoreGlobs and fires onChange for everything else", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ctxsync-watch-"));
    try {
      await writeFile(join(dir, "index.ts"), "export const a = 1;");
      await writeFile(join(dir, "ignored.log"), "noise");

      let changeCount = 0;
      const stop = watchRepo({
        cwd: dir,
        ignoreGlobs: ["*.log"],
        debounceMs: 30,
        onChange: () => {
          changeCount += 1;
        },
      });

      try {
        await writeFile(join(dir, "ignored.log"), "more noise");
        await Bun.sleep(150);
        expect(changeCount).toBe(0);

        await writeFile(join(dir, "index.ts"), "export count a = 2;");
        await Bun.sleep(150);
        expect(changeCount).toBeGreaterThanOrEqual(1);
      } finally {
        stop();
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 10_000);

  test("debounces rapid successive changes into a single onChange call", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ctxsync-watch-"));
    try {
      await writeFile(join(dir, "index.ts"), "export const a = 1;");

      let changeCount = 0;
      const stop = watchRepo({
        cwd: dir,
        ignoreGlobs: [],
        debounceMs: 100,
        onChange: () => {
          changeCount += 1;
        },
      });

      try {
        for (let i = 0; i < 5; i++) {
          await writeFile(join(dir, "index.ts"), `export const a = ${i};`);
          await Bun.sleep(10);
        }
        await Bun.sleep(300);
        expect(changeCount).toBe(1);
      } finally {
        stop();
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 10_000);
});
