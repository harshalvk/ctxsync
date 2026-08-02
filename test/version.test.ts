import { describe, expect, test } from "bun:test";
import { VERSION } from "../src/core/version.ts";

describe("VERSION", () => {
  test("is a non-empty semver-looking string", () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
