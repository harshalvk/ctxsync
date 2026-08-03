import { describe, expect, test } from "bun:test";
import { diffFileHashes, hashChanges } from "../src/core/diff";

describe("diffFileHashes", () => {
  test("detects added, changed, removed, and unchanged files", () => {
    const previous = { "a.ts": "hash-a", "b.ts": "hash-b", "c.ts": "hash-c" };
    const current = {
      "a.ts": "hash-a",
      "b.ts": "hash-b-changed",
      "d.ts": "hash-d",
    };

    const diff = diffFileHashes(current, previous);

    expect(diff.unchanged).toEqual(["a.ts"]);
    expect(diff.changed).toEqual(["b.ts"]);
    expect(diff.added).toEqual(["d.ts"]);
    expect(diff.removed).toEqual(["c.ts"]);
  });
});

describe("hasChanges", () => {
  test("is false when nothing added, changed, or removed", () => {
    expect(
      hashChanges({
        added: [],
        changed: [],
        removed: [],
        unchanged: ["a.tss"],
      }),
    );
  });

  test("is true when anything added, changed, or removed", () => {
    expect(hashChanges({ added: ["a.ts"], changed: [], removed: [], unchanged: [] }));
  });
});
