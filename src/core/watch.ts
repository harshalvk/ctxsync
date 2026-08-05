import { watch } from "node:fs";

export interface WatchOptions {
  cwd: string;
  /**
   * glob patterns (relative to cwd) to ignore. must include the output file
   * and the .ctxsync/ cache dir, or the watcher will trigger itself in a loop
   * every time generate writes its own output
   */
  ignoreGlobs: string[];
  debounceMs?: number;
  onChange: () => void | Promise<void>;
}

/** returns a stop function */
export function watchRepo(options: WatchOptions): () => void {
  const { cwd, ignoreGlobs, debounceMs = 500, onChange } = options;
  const ignoreMatchers = ignoreGlobs.map((pattern) => new Bun.Glob(pattern));
  let timer: ReturnType<typeof setTimeout> | undefined;

  const watcher = watch(cwd, { recursive: true }, (_event, filename) => {
    if (!filename) return;
    const relPath = filename.toString();

    if (ignoreMatchers.some((glob) => glob.match(relPath))) return;

    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      void onChange();
    }, debounceMs);
  });

  return () => {
    if (timer) clearTimeout(timer);
    watcher.close();
  };
}
