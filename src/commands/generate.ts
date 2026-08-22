import { defineCommand } from "citty";
import { loadConfig } from "../config/load.ts";
import { color } from "../core/colors.ts";
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
    if (args.output) config.output = args.output;

    async function runOnce(): Promise<void> {
      console.log(color.dim(`[ctxsync] Scanning repo (target: ${config.output})...`));
      const start = performance.now();

      try {
        const result = await generateContextFile(config, {
          write: !args["dry-run"],
          force: args.force,
        });
        const elapsedMs = Math.round(performance.now() - start);

        console.log(
          color.dim(
            `[ctxsync] Scanned ${result.filesScanned} files in ${elapsedMs}ms. Mode: ${result.mode}`,
          ),
        );

        if (result.mode === "skipped") {
          console.log(
            color.dim("[ctxsync] No changes detected since the last run — nothing to update."),
          );
          return;
        }

        if (args["dry-run"]) {
          console.log(color.dim("\n--- Generated content (dry run, not written) ---\n"));
          console.log(result.content);
        } else {
          console.log(color.green(`✓ Wrote ${config.output}`));
        }
      } catch (error) {
        console.error(color.red(`✗ Generation failed: ${(error as Error).message}`));
        if (!args.watch) process.exit(1);
      }
    }

    await runOnce();

    if (args.watch) {
      console.log(color.cyan("[ctxsync] Watching for changes... (Ctrl+C to stop)"));

      const stop = watchRepo({
        cwd: process.cwd(),
        ignoreGlobs: [...config.exclude, config.output, ".ctxsync/**"],
        onChange: runOnce,
      });

      process.on("SIGINT", () => {
        stop();
        console.log(color.dim("\n[ctxsync] Stopped watching."));
        process.exit(0);
      });

      await new Promise(() => {});
    }
  },
});
