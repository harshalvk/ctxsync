#!/usr/bin/env bun
import { defineCommand, runMain } from "citty";

const main = defineCommand({
  meta: {
    name: "ctxsync",
    version: "0.1.0",
    description: "Keep AI agent context files in sync with your codebase.",
  },
  subCommands: {
    // Real commands (generate, check, watch) land in Phase 2.
    // This placeholder exists purely to prove the CLI wiring works end-to-end.
    hello: defineCommand({
      meta: { description: "Sanity-check that the CLI is wired up correctly." },
      run() {
        console.log("ctxsync is alive.");
      },
    }),
  },
});

runMain(main);
