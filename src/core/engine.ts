import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { CtxsyncConfig } from "../config/schema";
import { generateText } from "./llm";
import { buildContextPrompt } from "./prompts";
import { scanRepo } from "./scanner";

export interface GenerateContextFileOptions {
  cwd?: string;
  /** if false, return the generated content without writing it to disk */
  write?: boolean;
  /** injectable for tests; defaults to the real generateText */
  generateFn?: typeof generateText;
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
  const generate = options.generateFn ?? generateText;

  const files = await scanRepo({
    cwd,
    include: config.include,
    exclude: config.exclude,
  });
  const prompt = buildContextPrompt(files);
  const content = await generate({ model: config.model, prompt });

  if (write) {
    await writeFile(join(cwd, config.output), content, "utf-8");
  }

  return { content, filesScanned: files.length };
}
