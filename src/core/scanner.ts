import { stat } from "node:fs/promises";
import { join } from "node:path";

export interface ScannedFile {
  /** Path relative to the repo root */
  path: string;
  content: string;
}

export interface ScanOptions {
  cwd: string;
  include: string[];
  exclude: string[];
  /** files larget than this are skipped (default 200kb) */
  maxFileBytes?: number;
}

const BINARY_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".ico",
  ".webp",
  ".pdf",
  ".zip",
  ".gz",
  ".tar",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".mp4",
  ".mp3",
  ".mov",
  ".wav",
]);

function isBinaryPath(path: string): boolean {
  const dotIndex = path.lastIndexOf(".");
  if (dotIndex === -1) return false;
  return BINARY_EXTENSIONS.has(path.slice(dotIndex));
}

/**
 * function scanRepo, scans a repo for text files matching `include`, excluding anything matching
 * `exclude`. returns file paths (relative to `cwd`) along with their content
 */
export async function scanRepo(options: ScanOptions): Promise<ScannedFile[]> {
  const { cwd, include, exclude, maxFileBytes = 200_000 } = options;
  const excludeGlobs = exclude.map((pattern) => new Bun.Glob(pattern));
  const seen = new Set<string>();
  const files: ScannedFile[] = [];

  for (const pattern of include) {
    const glob = new Bun.Glob(pattern);

    for await (const relPath of glob.scan({ cwd, dot: false })) {
      if (seen.has(relPath)) continue;
      if (excludeGlobs.some((g) => g.match(relPath))) continue;
      if (isBinaryPath(relPath)) continue;

      const fullPath = join(cwd, relPath);
      const fileStat = await stat(fullPath).catch(() => null);
      if (!fileStat || !fileStat.isFile()) continue;
      if (fileStat.size > maxFileBytes) continue;

      const content = await Bun.file(fullPath)
        .text()
        .catch(() => null);
      if (content === null) continue;

      seen.add(relPath);
      files.push({ path: relPath, content });
    }
  }

  return files;
}
