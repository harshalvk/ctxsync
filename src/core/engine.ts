import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { CtxsyncConfig } from "../config/schema";
import { buildContextPrompt } from "./prompts";
import { createProvider } from "./providers/registry";
import type { LLMProvider } from "./providers/types";
import { scanRepo } from "./scanner";

export interface GenerateContextFileOptions {
  cwd?: string;
  /** if false, return the generated content without writing it to disk */
  write?: boolean;
  /** injectable for tests; defaults to the real generateText */
  provider?: LLMProvider;
}

export interface GenerateContextFileResult {
  content: string;
  filesScanned: number;
}

export async function generateContextFile(
  config: CtxsyncConfig,
  options: GenerateContextFileOptions = {},
): Promise<GenerateContextFileResult> {
  const cwd = options.cwd ?? process.cwd();
  const write = options.write ?? true;
  const provider = options.provider ?? createProvider(config.provider);

  const files = await scanRepo({
    cwd,
    include: config.include,
    exclude: config.exclude,
  });
  const prompt = buildContextPrompt(files);
  const content = await provider.generateText({ model: config.model, prompt });

  if (write) {
    await writeFile(join(cwd, config.output), content, "utf-8");
  }

  return { content, filesScanned: files.length };
}
