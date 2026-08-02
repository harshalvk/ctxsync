import { defineCommand } from "citty";
import { loadConfig } from "../config/load.ts";

export const generateCommand = defineCommand({
  meta: {
    name: "generate",
    description: "Generate or update the AI agent context file for this repo.",
  },
  args: {
    output: {
      type: "string",
      description: "Override the output file path from config.",
      required: false,
    },
    "dry-run": {
      type: "boolean",
      description: "Print the generated content instead of writing it.",
      default: false,
    },
  },
  async run({ args }) {
    const config = await loadConfig();
    const outputPath = args.output ?? config.output;

    console.log(`[ctxsync] Target file: ${outputPath}`);
    console.log(`[ctxsync] Scanning:    ${config.include.join(", ")}`);
    console.log(`[ctxsync] Ignoring:    ${config.exclude.join(", ")}`);

    if (args["dry-run"]) {
      console.log("[ctxsync] Dry run — no file will be written.");
    }

    // Repo scanning + Claude summarization lands in Phase 3.
    console.log("[ctxsync] Generation engine not implemented yet (Phase 3).");
  },
});
