#!/usr/bin/env bun
import { defineCommand, runMain } from "citty";
import { version } from "../package.json" with { type: "json" };
import { checkCommand } from "./commands/check.ts";
import { estimateCommand } from "./commands/estimate.ts";
import { generateCommand } from "./commands/generate.ts";

const main = defineCommand({
  meta: {
    name: "ctxsync",
    version,
    description: "Keep AI agent context files in sync with your codebase.",
  },
  subCommands: {
    generate: generateCommand,
    check: checkCommand,
    estimate: estimateCommand,
  },
});

runMain(main);
