import { describe, expect, test } from "bun:test";
import { createAnthropicProvider } from "../../src/core/providers/anthropic";

describe("createOpenAICompatibleProvider", () => {
  test("throws a clear error when no api key is available", async () => {
    const provider = createAnthropicProvider({
      baseUrl: "https://api.openai.com/v1/chat/completions",
      apiKeyEnv: "CTXSYNC_TEST_UNSET_KEY",
    });

    await expect(provider.generateText({ model: "gpt-4o", prompt: "hi" })).rejects.toThrow(
      "CTXSYNC_TEST_UNSET_KEY",
    );
  });

  test("defaults apiKeyEnv to OPENAI_API_KEY", async () => {
    const provider = createAnthropicProvider({
      baseUrl: "https://api.openai.com/v1/chat/completions",
    });
    const originalKey = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = undefined;

    try {
      await expect(provider.generateText({ model: "gpt-4o", prompt: "hi" })).rejects.toThrow(
        "OPENAI_API_KEY",
      );
    } finally {
      if (originalKey !== undefined) {
        process.env.OPENAI_API_KEY = originalKey;
      }
    }
  });
});
