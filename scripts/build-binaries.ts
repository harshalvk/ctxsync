#!/usr/bin/env bun
import { mkdir } from "node:fs/promises";
import { $ } from "bun";

interface Target {
  target: string;
  outfile: string;
}

const targets: Target[] = [
  { target: "bun-linux-x64", outfile: "dist/binaries/ctxsync-linux-x64" },
  { target: "bun-linux-arm64", outfile: "dist/binaries/ctxsync-linux-arm64" },
  { target: "bun-darwin-x64", outfile: "dist/binaries/ctxsync-darwin-x64" },
  { target: "bun-darwin-arm64", outfile: "dist/binaries/ctxsync-darwin-arm64" },
  {
    target: "bun-windows-x64",
    outfile: "dist/binaries/ctxsync-windows-x64.exe",
  },
];

await mkdir("dist/binaries", { recursive: true });

for (const { target, outfile } of targets) {
  console.log(`Building ${outfile} (${target})...`);
  await $`bun build ./src/cli.ts --compile --target=${target} --outfile ${outfile}`;
}

console.log(`\nBuilt ${targets.length} binaries in dist/binaries`);
