import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { ScannedFile } from "./scanner";

export interface CacheData {
  /** path -> sha256 hex hash of that file's content, from the last successful generate */
  fileHashes: Record<string, string>;
  generatedAt: string;
}

const CACHE_PATH = ".ctxsync/cache.json";

export function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

export function hashFiles(files: ScannedFile[]): Record<string, string> {
  const hashes: Record<string, string> = {};
  for (const file of files) {
    hashes[file.path] = hashContent(file.content);
  }
  return hashes;
}

export async function loadCache(cwd: string): Promise<CacheData | null> {
  const file = Bun.file(join(cwd, CACHE_PATH));
  if (!(await file.exists())) return null;

  try {
    return (await file.json()) as CacheData;
  } catch {
    return null;
  }
}

export async function saveCache(cwd: string, data: CacheData): Promise<void> {
  const path = join(cwd, CACHE_PATH);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(data, null, 2), "utf-8");
}
