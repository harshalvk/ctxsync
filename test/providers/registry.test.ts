import { describe, expect, test } from "bun:test";
import { createProvider } from "../../src/core/providers/registry.ts";

describe("createProvider", () => {
  test("creates an Anthropic provider from { type: 'anthropic' }", () => {
    const provider = createProvider({ type: "anthropic" });
    expect(provider.id).toBe("anthropic");
  });

  test("creates an OpenAI-compatible provider from { type: 'openai-compatible' }", () => {
    const provider = createProvider({
      type: "openai-compatible",
      baseUrl: "https://api.openai.com/v1/chat/completions",
    });
    expect(provider.id).toBe("openai-compatible");
  });
});
