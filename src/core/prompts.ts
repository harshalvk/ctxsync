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
