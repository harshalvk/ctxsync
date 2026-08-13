import { join } from "node:path";

import type { CtxsyncConfig } from "../config/schema";
import { hashFiles, loadCache } from "./cache";
import { diffFileHashes, hashChanges } from "./diff";
import { scanRepo } from "./scanner";

export type ContextFileStatus =
  | { status: "missing" }
  | { status: "no-cache" }
  | { status: "stale"; changedCount: number }
  | { status: "up-to-date" };

export async function checkContextFile(
  config: CtxsyncConfig,
  cwd: string = process.cwd(),
): Promise<ContextFileStatus> {
  const outputFile = Bun.file(join(cwd, config.output));
  if (!(await outputFile.exists())) {
    return { status: "missing" };
  }

  const cache = await loadCache(cwd);
  if (!cache) {
    return { status: "no-cache" };
  }

  const files = await scanRepo({
    cwd,
    include: config.include,
    exclude: config.exclude,
    respectGitignore: config.respectGitignore,
  });
  const currentHashes = hashFiles(files);
  const diff = diffFileHashes(currentHashes, cache.fileHashes);

  if (hashChanges(diff)) {
    return {
      status: "stale",
      changedCount: diff.added.length + diff.changed.length + diff.removed.length,
    };
  }

  return { status: "up-to-date" };
}
