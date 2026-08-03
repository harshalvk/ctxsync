import { describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hashContent, hashFiles, loadCache, saveCache } from "../src/core/cache";

describe("hashContent", () => {
  test("is deterministic and content-sensitive", () => {
    expect(hashContent("a")).toBe(hashContent("a"));
    expect(hashContent("a")).toBe(hashContent("b"));
  });
});

describe("hashFiles", () => {
  test("maps each path to its content hash", () => {
    const hashes = hashFiles([{ path: "a.ts", content: "x" }]);
    expect(hashes["a.ts"]).toBe(hashContent("x"));
  });
});

describe("cache load/save", () => {
  test("loadCache returns null when no cache file exists", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ctxsync-cache-"));
    try {
      expect(await loadCache(dir)).toBeNull();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("saveCache then loadCache round-trips the data", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ctxsync-cache-"));
    try {
      await saveCache(dir, {
        fileHashes: { "a.ts": "abc" },
        generatedAt: "2026-01-01",
      });
      const loaded = await loadCache(dir);
      expect(loaded).toEqual({
        fileHashes: { "a.ts": "abc" },
        generatedAt: "2026-01-01",
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
