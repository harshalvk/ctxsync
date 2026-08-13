import { describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scanRepo } from "../src/core/scanner";

describe("scanRepo", () => {
  test("finds included files and skips excluded ones", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ctxsync-scanner-"));
    try {
      await writeFile(join(dir, "index.ts"), "console.log('hi');");
      await mkdir(join(dir, "node_modules"));
      await writeFile(join(dir, "node_modules", "ignored.ts"), "should not appear");

      const files = await scanRepo({
        cwd: dir,
        include: ["**/*.ts"],
        exclude: ["node_modules/**"],
      });

      const paths = files.map((f) => f.path);
      expect(paths).toContain("index.ts");
      expect(paths).not.toContain("node_modules/ignored.ts");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("skips binary files extensions", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ctxsync-scanner-"));
    try {
      await writeFile(join(dir, "logo.png"), "fake-binary-content");
      await writeFile(join(dir, "readme.md"), "# hello");

      const files = await scanRepo({
        cwd: dir,
        include: ["**/*"],
        exclude: [],
      });
      const paths = files.map((f) => f.path);

      expect(paths).toContain("readme.md");
      expect(paths).not.toContain("logo.png");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("respects .gitignore by default, merging it with explicit exclude", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ctxsync-scanner-"));
    try {
      await writeFile(join(dir, ".gitignore"), "*.log\n");
      await writeFile(join(dir, "app.log"), "log noise");
      await writeFile(join(dir, "index.ts"), "export const a = 1;");

      const files = await scanRepo({
        cwd: dir,
        include: ["**/*"],
        exclude: [],
      });
      const paths = files.map((f) => f.path);

      expect(paths).toContain("index.ts");
      expect(paths).not.toContain("app.log");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("skips .gitignore entirely when respectGitignore is false", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ctxsync-scanner-"));
    try {
      await writeFile(join(dir, ".gitignore"), "*.log\n");
      await writeFile(join(dir, "app.log"), "log noise");

      const files = await scanRepo({
        cwd: dir,
        include: ["**/*"],
        exclude: [],
        respectGitignore: false,
      });
      const paths = files.map((f) => f.path);

      expect(paths).toContain("app.log");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
