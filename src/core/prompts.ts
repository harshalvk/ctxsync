import type { FileDiff } from "./diff";
import type { ScannedFile } from "./scanner";

// conservative char budget for the file contents portion of the prompt
const MAX_TOTAL_CHARS = 60_000;

export function buildContextPrompt(files: ScannedFile[]): string {
  const included: ScannedFile[] = [];
  let totalChars = 0;

  for (const file of files) {
    if (totalChars + file.content.length > MAX_TOTAL_CHARS) continue;
    included.push(file);
    totalChars += file.content.length;
  }

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
  /** content for the added + changed files only (not the whole repo) */
  changedFiles: ScannedFile[];
}

/**
 * builds a prompt that asks the model to update an existing AGENTS.md in light
 * of a diff, instead of regenerating the whole thing from scratch.
 * much cheaper and faster once a repo has any real size
 */
export function buildUpdatePrompt(input: UpdatePromptInput): string {
  const { existingContent, diff, changedFiles } = input;

  const fileBlocks = changedFiles
    .map((file) => `--- ${file.path} ---\n${file.content}`)
    .join("\n\n");

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
