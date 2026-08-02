#!/usr/bin/env bun
import { defineCommand, runMain } from "citty";
import { checkCommand } from "./commands/check.ts";
import { generateCommand } from "./commands/generate.ts";

const main = defineCommand({
  meta: {
    name: "ctxsync",
    version: "0.1.0",
    description: "Keep AI agent context files in sync with your codebase.",
  },
  subCommands: {
    generate: generateCommand,
    check: checkCommand,
  },
});

runMain(main);
