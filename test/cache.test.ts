import { describe, expect, test } from "bun:test";
import { createOpenAICompatibleProvider } from "../src/core/providers/openai-compatible";

describe("createOpenAICompatibleProvider", () => {
  test("throws a clear error when no API key is available", async () => {
    const provider = createOpenAICompatibleProvider({
      baseUrl: "https://api.openai.com/v1/chat/completions",
      apiKeyEnv: "CTXSYNC_TEST_UNSET_KEY",
    });

    await expect(provider.generateText({ model: "gpt-4o", prompt: "hi" })).rejects.toThrow(
      "CTXSYNC_TEST_UNSET_KEY",
    );
  });

  test("defaults apiKeyEnv to OPENAI_API_KEY", async () => {
    const provider = createOpenAICompatibleProvider({
      baseUrl: "https://api.openai.com/v1/chat/completions",
    });
    const originalKey = process.env.OPENAI_API_KEY;
    // On some platforms (confirmed on Windows), assigning undefined coerces
    // to the string "undefined" instead of unsetting the var, which silently
    // breaks this test's whole premise — delete is correct here.
    // biome-ignore lint/performance/noDelete: see comment above
    delete process.env.OPENAI_API_KEY;

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
