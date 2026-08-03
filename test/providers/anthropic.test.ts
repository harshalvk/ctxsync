import { describe, expect, test } from "bun:test";
import { createAnthropicProvider } from "../../src/core/providers/anthropic";

describe("createAnthropicProvider", () => {
  test("throws a clear error when no api key is available", async () => {
    const provider = createAnthropicProvider();
    const originalKey = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = undefined;

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

  test("respects a custom apiKeyEnv name is its error message", async () => {
    const provider = createAnthropicProvider({ apiKeyEnv: "MY_CUSTOM_KEY" });

    await expect(provider.generateText({ model: "claude-sonnet-5", prompt: "hi" })).rejects.toThrow(
      "MY_CUSTOM_KEY",
    );
  });
});
