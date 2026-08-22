import { describe, expect, test } from "bun:test";
import { summarizeFiles } from "../src/core/estimate.ts";

describe("summarizeFiles", () => {
  test("counts total files and chars correctly", () => {
    const files = [
      { path: "a.ts", content: "x".repeat(100) },
      { path: "b.ts", content: "y".repeat(200) },
    ];
    const result = summarizeFiles(files, 60_000);

    expect(result.totalFiles).toBe(2);
    expect(result.totalChars).toBe(300);
  });

  test("estimates tokens as roughly chars / 4", () => {
    const files = [{ path: "a.ts", content: "x".repeat(400) }];
    const result = summarizeFiles(files, 60_000);

    expect(result.estimatedTokens).toBe(100);
  });

  test("everything fits: includedFiles equals totalFiles, excludedFiles is 0", () => {
    const files = [
      { path: "a.ts", content: "x".repeat(100) },
      { path: "b.ts", content: "y".repeat(100) },
    ];
    const result = summarizeFiles(files, 60_000);

    expect(result.includedFiles).toBe(2);
    expect(result.excludedFiles).toBe(0);
  });

  test("a small budget correctly reports excluded files", () => {
    const files = [
      { path: "package.json", content: "x".repeat(500) }, // high priority, should be included
      { path: "deep/nested/random.ts", content: "y".repeat(500) }, // low priority, likely excluded
    ];
    const result = summarizeFiles(files, 600);

    expect(result.totalFiles).toBe(2);
    expect(result.includedFiles).toBe(1);
    expect(result.excludedFiles).toBe(1);
    expect(result.includedChars).toBeLessThan(600);
  });

  test("largestFiles is sorted descending by size and capped at 10", () => {
    const files = Array.from({ length: 15 }, (_, i) => ({
      path: `file${i}.ts`,
      content: "x".repeat((i + 1) * 100),
    }));
    const result = summarizeFiles(files, 60_000);

    expect(result.largestFiles).toHaveLength(10);
    expect(result.largestFiles[0]?.path).toBe("file14.ts");
    expect(result.largestFiles[0]?.chars).toBe(1500);

    for (let i = 1; i < result.largestFiles.length; i++) {
      const prevChars = result.largestFiles[i - 1]?.chars ?? 0;
      const currChars = result.largestFiles[i]?.chars ?? 0;
      expect(prevChars).toBeGreaterThanOrEqual(currChars);
    }
  });

  test("handles an empty file list without dividing by zero or crashing", () => {
    const result = summarizeFiles([], 60_000);

    expect(result.totalFiles).toBe(0);
    expect(result.totalChars).toBe(0);
    expect(result.estimatedTokens).toBe(0);
    expect(result.includedFiles).toBe(0);
    expect(result.excludedFiles).toBe(0);
    expect(result.largestFiles).toEqual([]);
  });
});
