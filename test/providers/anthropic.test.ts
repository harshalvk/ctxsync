import { describe, expect, test } from "bun:test";
import { createAnthropicProvider } from "../../src/core/providers/anthropic.ts";

describe("createAnthropicProvider", () => {
  test("throws a clear error when no API key is available", async () => {
    const provider = createAnthropicProvider();
    const originalKey = process.env.ANTHROPIC_API_KEY;
    // On some platforms (confirmed on Windows), assigning undefined coerces
    // to the string "undefined" instead of unsetting the var, which silently
    // breaks this test's whole premise — delete is correct here.
    // biome-ignore lint/performance/noDelete: see comment above
    delete process.env.ANTHROPIC_API_KEY;

    try {
      await expect(
        provider.generateText({ model: "claude-sonnet-5", prompt: "hi" }),
      ).rejects.toThrow("ANTHROPIC_API_KEY");
    } finally {
      if (originalKey !== undefined) {
        process.env.ANTHROPIC_API_KEY = originalKey;
      }
    }
  });

  test("respects a custom apiKeyEnv name in its error message", async () => {
    const provider = createAnthropicProvider({ apiKeyEnv: "MY_CUSTOM_KEY" });

    await expect(provider.generateText({ model: "claude-sonnet-5", prompt: "hi" })).rejects.toThrow(
      "MY_CUSTOM_KEY",
    );
  });
});
