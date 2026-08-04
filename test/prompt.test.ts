import { describe, expect, test } from "bun:test";
import { buildContextPrompt, buildUpdatePrompt } from "../src/core/prompts.ts";

describe("buildContextPrompt", () => {
  test("includes file path and content", () => {
    const prompt = buildContextPrompt([{ path: "src/index.ts", content: "export const x = 1;" }]);
    expect(prompt).toContain("src/index.ts");
    expect(prompt).toContain("export const x = 1;");
  });

  test("drops files once the char budget is exceeded", () => {
    const bigFile = { path: "big.ts", content: "x".repeat(70_000) };
    const smallFile = { path: "small.ts", content: "y".repeat(100) };

    const prompt = buildContextPrompt([bigFile, smallFile]);

    expect(prompt).not.toContain("big.ts");
    expect(prompt).toContain("small.ts");
  });
});

describe("buildUpdatePrompt", () => {
  test("includes existing content, diff summary, and changed file content", () => {
    const prompt = buildUpdatePrompt({
      existingContent: "# Existing docs",
      diff: {
        added: ["new.ts"],
        changed: ["old.ts"],
        removed: ["gone.ts"],
        unchanged: [],
      },
      changedFiles: [
        { path: "new.ts", content: "export const a = 1;" },
        { path: "old.ts", content: "export const b = 2;" },
      ],
    });

    expect(prompt).toContain("# Existing docs");
    expect(prompt).toContain("Added: new.ts");
    expect(prompt).toContain("Modified: old.ts");
    expect(prompt).toContain("Removed: gone.ts");
    expect(prompt).toContain("export const a = 1;");
  });
});
