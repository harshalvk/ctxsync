import { defineCommand } from "citty";
import { loadConfig } from "../config/load.ts";
import { color } from "../core/colors.ts";
import { estimateRepo } from "../core/estimate.ts";

export const estimateCommand = defineCommand({
  meta: {
    name: "estimate",
    description: "Preview what generate would scan and send — zero API calls, zero cost.",
  },
  async run() {
    const config = await loadConfig();
    const result = await estimateRepo(config);

    console.log(
      color.dim(
        `[ctxsync] Scanned ${
          result.totalFiles
        } files, ${result.totalChars.toLocaleString()} chars (~${result.estimatedTokens.toLocaleString()} tokens estimated)`,
      ),
    );
    console.log(
      color.dim(`[ctxsync] Prompt budget: ${config.maxPromptChars.toLocaleString()} chars`),
    );

    if (result.excludedFiles > 0) {
      console.log(
        color.yellow(
          `⚠ ${result.excludedFiles} file(s) won't fit in the budget and would be skipped entirely.`,
        ),
      );
      console.log(
        color.dim(
          '  Narrow "include"/"exclude" in ctxsync.config.ts, or raise maxPromptChars, to change this.',
        ),
      );
    } else {
      console.log(color.green(`✓ All ${result.includedFiles} files fit within the budget.`));
    }

    if (result.largestFiles.length > 0) {
      console.log("\nLargest files:");
      for (const file of result.largestFiles) {
        console.log(`  ${file.path.padEnd(50)} ${file.chars.toLocaleString()} chars`);
      }
    }
  },
});
