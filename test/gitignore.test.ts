import { describe, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadGitignorePatterns } from "../src/core/gitignore";

describe("loadGitignorePatterns", () => {
  test("returns an empty array when there's no .gitignore", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ctxsync-gitignore-"));
    try {
      expect(await loadGitignorePatterns(dir)).toEqual([]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("skips comments and blank lines", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ctxsync-gitignore-"));
    try {
      await writeFile(join(dir, ".gitignore"), "# comment\n\n*.log\n");
      const patterns = await loadGitignorePatterns(dir);
      expect(patterns).toEqual(["*.log", "**/*.log"]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("skips negation lines", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ctxsync-gitignore-"));
    try {
      await writeFile(join(dir, ".gitignore"), "*.log\n!important.log\n");
      const patterns = await loadGitignorePatterns(dir);
      expect(patterns).toEqual(["*.log", "**/*.log"]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("strips a leading slash (root-anchored patterns)", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ctxsync-gitignore-"));
    try {
      await writeFile(join(dir, ".gitignore"), "/dist\n");
      const patterns = await loadGitignorePatterns(dir);
      expect(patterns).toEqual(["dist"]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("expands a trailing-slash directory pattern to match its contents", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ctxsync-gitignore-"));
    try {
      await writeFile(join(dir, ".gitignore"), "build/\n");
      const patterns = await loadGitignorePatterns(dir);
      expect(patterns).toEqual(["build/**"]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
