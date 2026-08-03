export interface FileDiff {
  added: string[];
  changed: string[];
  removed: string[];
  unchanged: string[];
}

export function diffFileHashes(
  current: Record<string, string>,
  previous: Record<string, string>,
): FileDiff {
  const added: string[] = [];
  const changed: string[] = [];
  const unchanged: string[] = [];

  for (const [path, hash] of Object.entries(current)) {
    if (!(path in previous)) {
      added.push(path);
    } else if (previous[path] !== hash) {
      changed.push(path);
    } else {
      unchanged.push(path);
    }
  }

  const removed = Object.keys(previous).filter((path) => !(path in current));

  return { added, changed, removed, unchanged };
}

export function hashChanges(diff: FileDiff): boolean {
  return diff.added.length > 0 || diff.changed.length > 0 || diff.removed.length > 0;
}
