import type { FileDiff } from "./diff.ts";
import { prioritizeFiles } from "./prioritize.ts";
import type { ScannedFile } from "./scanner.ts";

// Default conservative char budget for the file contents portion of the prompt.
// Real token-aware budgeting is a future improvement; this keeps v1 simple and
// safe. Callers can override it (see CtxsyncConfig.maxPromptChars) — some
// providers/tiers (e.g. Groq's free tier: 12k tokens/min) need it much smaller
// than what's fine for Claude/GPT-class rate limits.
export const DEFAULT_MAX_PROMPT_CHARS = 60_000;

// No single file is allowed to eat more than this much of the budget. Without
// this, one large generated/vendored file that slipped past excludes could
// consume the entire prompt, crowding out everything else. Truncating to
// head+tail keeps some signal instead of dropping the file entirely.
const MAX_CHARS_PER_FILE = 8_000;

function truncateFileContent(content: string): string {
  if (content.length <= MAX_CHARS_PER_FILE) return content;

  const headChars = Math.floor(MAX_CHARS_PER_FILE * 0.7);
  const tailChars = MAX_CHARS_PER_FILE - headChars;
  const omittedChars = content.length - MAX_CHARS_PER_FILE;

  const head = content.slice(0, headChars);
  const tail = content.slice(content.length - tailChars);

  return `${head}\n\n... [${omittedChars} chars truncated] ...\n\n${tail}`;
}

/**
 * Prioritizes files (manifests/README/entry points first), truncates any
 * individual file that would otherwise dominate the budget, then greedily
 * fills the remaining budget in priority order. Continues past files that
 * don't fit (rather than stopping at the first miss) so a later, smaller,
 * lower-priority file still gets included if there's room for it.
 */
export function selectFilesWithinBudget(files: ScannedFile[], maxChars: number): ScannedFile[] {
  const prioritized = prioritizeFiles(files);
  const included: ScannedFile[] = [];
  let totalChars = 0;

  for (const file of prioritized) {
    const content = truncateFileContent(file.content);
    if (totalChars + content.length > maxChars) continue;

    included.push({ ...file, content });
    totalChars += content.length;
  }

  return included;
}

export function buildContextPrompt(
  files: ScannedFile[],
  maxChars: number = DEFAULT_MAX_PROMPT_CHARS,
): string {
  const included = selectFilesWithinBudget(files, maxChars);
  const fileBlocks = included.map((file) => `--- ${file.path} ---\n${file.content}`).join("\n\n");

  return [
    "You are generating an AGENTS.md file: a concise reference document that helps AI coding",
    "assistants understand this codebase quickly. Cover: what the project does, the directory",
    "structure and what each part is responsible for, key conventions (naming, error handling,",
    "testing patterns), and any gotchas a newcomer (human or AI) should know before making changes.",
    "",
    "Be concrete and specific to this codebase — do not write generic advice. Keep it under 500 words.",
    "Output only the Markdown content of the file, no commentary before or after.",
    "",
    "Here are the repo's files:",
    "",
    fileBlocks,
  ].join("\n");
}

export interface UpdatePromptInput {
  existingContent: string;
  diff: FileDiff;
  /** Content for the added + changed files only (not the whole repo). */
  changedFiles: ScannedFile[];
}

/**
 * Builds a prompt that asks the model to update an existing AGENTS.md in light
 * of a diff, instead of regenerating the whole thing from scratch. Much cheaper
 * and faster once a repo has any real size.
 */
export function buildUpdatePrompt(
  input: UpdatePromptInput,
  maxChars: number = DEFAULT_MAX_PROMPT_CHARS,
): string {
  const { existingContent, diff, changedFiles } = input;

  const included = selectFilesWithinBudget(changedFiles, maxChars);
  const fileBlocks = included.map((file) => `--- ${file.path} ---\n${file.content}`).join("\n\n");

  const lines = [
    "You maintain an AGENTS.md file: a concise reference document that helps AI coding",
    "assistants understand this codebase. Below is the CURRENT AGENTS.md content, followed",
    "by a summary of what changed in the repo since it was last generated.",
    "",
    "Update the document to reflect these changes. Keep everything still accurate as-is —",
    "do not rewrite unrelated sections. Output only the full, updated Markdown content of",
    "the file, no commentary before or after.",
    "",
    "--- CURRENT AGENTS.md ---",
    existingContent,
    "",
    `--- CHANGES: ${diff.added.length} added, ${diff.changed.length} modified, ${diff.removed.length} removed ---`,
  ];

  if (diff.added.length > 0) lines.push(`Added: ${diff.added.join(", ")}`);
  if (diff.changed.length > 0) lines.push(`Modified: ${diff.changed.join(", ")}`);
  if (diff.removed.length > 0) lines.push(`Removed: ${diff.removed.join(", ")}`);

  lines.push("", "--- CONTENT OF ADDED/MODIFIED FILES ---", "", fileBlocks);

  return lines.join("\n");
}
