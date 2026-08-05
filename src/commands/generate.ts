import { defineCommand } from "citty";
import { loadConfig } from "../config/load.ts";
import { generateContextFile } from "../core/engine.ts";
import { watchRepo } from "../core/watch.ts";

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
    force: {
      type: "boolean",
      description: "Ignore the cache and regenerate the entire file from scratch.",
      default: false,
    },
    watch: {
      type: "boolean",
      description: "Watch the repo and regenerate automatically on file changes.",
      default: false,
    },
  },
  async run({ args }) {
    const config = await loadConfig();
    if (typeof args.output === "string" && args.output) {
      config.output = args.output;
    }

    async function runOnce(): Promise<void> {
      console.log(`[ctxsync] Scanning repo (target: ${config.output})...`);

      try {
        const result = await generateContextFile(config, {
          write: !args["dry-run"],
          force: args.force === true,
        });
        console.log(`[ctxsync] Scanned ${result.filesScanned} files. Mode: ${result.mode}`);

        if (result.mode === "skipped") {
          console.log("[ctxsync] No changes detected since the last run - nothing to update.");
        }

        if (args["dry-run"]) {
          console.log("\n--- Generated content (dry run, not written) ---\n");
          console.log(result.content);
        } else {
          console.log(`[ctxsync] Wrote ${config.output}`);
        }
      } catch (error) {
        console.error(`[ctxsync] Generation failed: ${(error as Error).message}`);
        if (!args.watch) process.exit(1);
      }
    }

    await runOnce();

    if (args.watch) {
      console.log("[ctxsync] watching for changes... (ctrl+c to stop)");

      const stop = watchRepo({
        cwd: process.cwd(),
        ignoreGlobs: [...config.exclude, config.output, ".ctxsync/**"],
        onChange: runOnce,
      });

      process.on("SIGINT", () => {
        stop();
        console.log("\n[ctxsync] stopped watching.");
        process.exit(0);
      });

      await new Promise(() => {});
    }
  },
});
