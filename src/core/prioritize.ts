import type { ScannedFile } from "./scanner.ts";

const HIGH_VALUE_FILENAMES = new Set([
  "package.json",
  "pyproject.toml",
  "cargo.toml",
  "go.mod",
  "composer.json",
  "gemfile",
  "requirements.txt",
  "readme.md",
]);

const ENTRYPOINT_PATTERN = /(^|\/)(index|main|cli|app|server)\.(ts|tsx|js|jsx|py|go|rs|rb)$/i;
const TEST_PATTERN = /\.(test|spec)\.[jt]sx?$/i;

function scoreFile(file: ScannedFile): number {
  const fileName = (file.path.split("/").pop() ?? file.path).toLowerCase();
  const depth = file.path.split("/").length;

  let score = 0;
  if (HIGH_VALUE_FILENAMES.has(fileName)) score += 100;
  if (ENTRYPOINT_PATTERN.test(file.path)) score += 50;
  if (TEST_PATTERN.test(fileName)) score -= 40;
  score -= depth * 3; // prefer shallower paths
  score -= Math.min(20, Math.floor(file.content.length / 2000)); // mild penalty for very large files

  return score;
}

/**
 * Orders files so the highest-signal ones (manifests, README, entry points,
 * shallow paths) come first and get priority for the prompt budget, instead
 * of relying on scan order (which is essentially filesystem-arbitrary).
 */
export function prioritizeFiles(files: ScannedFile[]): ScannedFile[] {
  return [...files].sort((a, b) => scoreFile(b) - scoreFile(a));
}
