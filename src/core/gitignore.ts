import { join } from "node:path";

/**
 * Parses a .gitignore file into glob patterns compatible with scanRepo's
 * exclude matching. This is a practical subset of gitignore syntax, not a
 * full implementation:
 *
 *   - Comments (#) and blank lines are skipped.
 *   - Negation patterns (!foo) are NOT supported and are skipped entirely —
 *     full negation semantics require order-sensitive re-inclusion that
 *     doesn't map cleanly onto a flat exclude-glob list. A skipped negation
 *     line just means that specific re-inclusion doesn't happen; it never
 *     causes something to be wrongly excluded.
 *   - A pattern with no "/" matches at any depth (mirrors gitignore).
 *   - A pattern ending in "/" is treated as matching that directory's
 *     contents recursively.
 *
 * Returns an empty array if there's no .gitignore.
 */
export async function loadGitignorePatterns(cwd: string): Promise<string[]> {
  const file = Bun.file(join(cwd, ".gitignore"));
  if (!(await file.exists())) return [];

  const lines = (await file.text()).split("\n");
  const patterns: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || line.startsWith("!")) continue;

    // Directory pattern (traling slash) -> match everything inside it
    const pattern = line.endsWith("/") ? `${line}**` : line;

    if (!pattern.includes("/")) {
      // No slash: git matches this at any depth. "**/" matches root-level
      // files too (confirmed: Bun.Glob's ** matches zero or more dirs),
      // so one pattern covers both cases
      patterns.push(pattern, `**/${pattern}`);
    } else {
      patterns.push(pattern.replace(/^\//, ""));
    }
  }

  return patterns;
}
