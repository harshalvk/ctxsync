import type { CtxsyncConfig } from "../config/schema";
import { selectFilesWithinBudget } from "./prompts";
import { getEffectiveExclude } from "./scanExclusions";
import { type ScannedFile, scanRepo } from "./scanner";

export interface EstimateResult {
  totalFiles: number;
  totalChars: number;
  estimatedTokens: number;
  includedFiles: number;
  includedChars: number;
  excludedFiles: number;
  largestFiles: { path: string; chars: number }[];
}

const CHARS_PER_TOKEN_ESTIMATE = 3.2;
const LARGEST_FILES_SHOWN = 10;

/**
 * Pure aggregation over an already-scanned file list — no I/O. Separated out
 * from estimateRepo so this logic (the part actually worth testing
 * thoroughly) doesn't require a real filesystem to verify.
 */
export function summarizeFiles(files: ScannedFile[], maxChars: number): EstimateResult {
  const totalChars = files.reduce((sum, f) => sum + f.content.length, 0);
  const included = selectFilesWithinBudget(files, maxChars);
  const includedChars = included.reduce((sum, f) => sum + f.content.length, 0);

  const largestFiles = [...files]
    .sort((a, b) => b.content.length - a.content.length)
    .slice(0, LARGEST_FILES_SHOWN)
    .map((f) => ({ path: f.path, chars: f.content.length }));

  return {
    totalFiles: files.length,
    totalChars,
    estimatedTokens: Math.round(totalChars / CHARS_PER_TOKEN_ESTIMATE),
    includedFiles: included.length,
    includedChars,
    excludedFiles: files.length - included.length,
    largestFiles,
  };
}

/**
 * Pure aggregation over an already-scanned file list — no I/O. Separated out
 * from estimateRepo so this logic (the part actually worth testing
 * thoroughly) doesn't require a real filesystem to verify.
 */
export async function estimateRepo(
  config: CtxsyncConfig,
  cwd: string = process.cwd(),
): Promise<EstimateResult> {
  const files = await scanRepo({
    cwd,
    include: config.include,
    exclude: getEffectiveExclude(config),
    respectGitignore: config.respectGitignore,
  });

  return summarizeFiles(files, config.maxPromptChars);
}
