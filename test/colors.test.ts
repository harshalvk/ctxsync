import { describe, expect, test } from "bun:test";
import { color, isColorEnabled } from "../src/core/colors.ts";

describe("isColorEnabled", () => {
  test("is false when NO_COLOR is set, regardless of TTY state", () => {
    const original = process.env.NO_COLOR;
    process.env.NO_COLOR = "1";
    try {
      expect(isColorEnabled()).toBe(false);
    } finally {
      if (original !== undefined) {
        process.env.NO_COLOR = original;
      } else {
        // biome-ignore lint/performance/noDelete: see comment in providers/anthropic.test.ts
        delete process.env.NO_COLOR;
      }
    }
  });
});

describe("color", () => {
  // process.stdout.isTTY varies by platform/context (e.g. it's genuinely true
  // in an interactive Windows terminal, false in most CI/piped contexts) — so
  // these tests explicitly control it rather than assuming either state.

  test("returns plain text unchanged when isTTY is false", () => {
    const originalTTY = process.stdout.isTTY;
    Object.defineProperty(process.stdout, "isTTY", {
      value: false,
      configurable: true,
    });
    try {
      expect(isColorEnabled()).toBe(false);
      expect(color.red("error")).toBe("error");
      expect(color.green("ok")).toBe("ok");
      expect(color.dim("hint")).toBe("hint");
    } finally {
      Object.defineProperty(process.stdout, "isTTY", {
        value: originalTTY,
        configurable: true,
      });
    }
  });

  test("wraps text in ANSI codes when isTTY is true and NO_COLOR is unset", () => {
    const originalTTY = process.stdout.isTTY;
    const originalNoColor = process.env.NO_COLOR;
    Object.defineProperty(process.stdout, "isTTY", {
      value: true,
      configurable: true,
    });
    // biome-ignore lint/performance/noDelete: see comment in providers/anthropic.test.ts
    delete process.env.NO_COLOR;

    try {
      expect(isColorEnabled()).toBe(true);
      expect(color.red("error")).toBe("\x1b[31merror\x1b[0m");
      expect(color.green("ok")).toBe("\x1b[32mok\x1b[0m");
      expect(color.dim("hint")).toBe("\x1b[2mhint\x1b[0m");
    } finally {
      Object.defineProperty(process.stdout, "isTTY", {
        value: originalTTY,
        configurable: true,
      });
      if (originalNoColor !== undefined) process.env.NO_COLOR = originalNoColor;
    }
  });
});
