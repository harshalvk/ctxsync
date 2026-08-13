import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { CtxsyncConfig } from "../config/schema";
import { hashFiles, loadCache, saveCache } from "./cache";
import { diffFileHashes, hashChanges } from "./diff";
import { buildContextPrompt, buildUpdatePrompt } from "./prompts";
import { createProvider } from "./providers/registry";
import type { LLMProvider } from "./providers/types";
import { scanRepo } from "./scanner";

export interface GenerateContextFileOptions {
  cwd?: string;
  /** if false, return the generated content without writing it to disk */
  write?: boolean;
  /** injectable for tests; defaults to the real generateText */
  provider?: LLMProvider;
  /** ignore the cache and force a full regeneration from scratch */
  force?: boolean;
}

export interface GenerateContextFileResult {
  content: string;
  filesScanned: number;
  /**
   * "full"        - no prior cache/output file, generated from scratch
   * "incremental" - cache existed and something changed; updated the exisiting doc
   * "skipped"     - cache existed and nothing changed; no LLM call was made
   */
  mode: "full" | "incremental" | "skipped";
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
    respectGitignore: config.respectGitignore,
  });
  const currentHashes = hashFiles(files);

  const cache = options.force ? null : await loadCache(cwd);
  const outputFile = Bun.file(join(cwd, config.output));
  const existingContent = (await outputFile.exists()) ? await outputFile.text() : null;

  let content: string;
  let mode: GenerateContextFileResult["mode"];

  if (!cache || existingContent === null) {
    const prompt = buildContextPrompt(files);
    content = await provider.generateText({ model: config.model, prompt });
    mode = "full";
  } else {
    const diff = diffFileHashes(currentHashes, cache.fileHashes);

    if (!hashChanges(diff)) {
      content = existingContent;
      mode = "skipped";
    } else {
      const changedPaths = new Set([...diff.added, ...diff.changed]);
      const changedFiles = files.filter((file) => changedPaths.has(file.path));
      const prompt = buildUpdatePrompt({ existingContent, diff, changedFiles });
      content = await provider.generateText({ model: config.model, prompt });
      mode = "incremental";
    }
  }

  if (write) {
    if (mode !== "skipped") {
      await writeFile(join(cwd, config.output), content, "utf-8");
    }
    await saveCache(cwd, {
      fileHashes: currentHashes,
      generatedAt: new Date().toISOString(),
    });
  }

  return { content, filesScanned: files.length, mode };
}
