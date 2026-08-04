import { defineCommand } from "citty";
import { loadConfig } from "../config/load.ts";
import { checkContextFile } from "../core/status.ts";

export const checkCommand = defineCommand({
  meta: {
    name: "check",
    description: "Check whether the context file exists (CI-friendly, exits non-zero on failure).",
  },
  async run() {
    const config = await loadConfig();
    const result = await checkContextFile(config);

    switch (result.status) {
      case "missing":
        console.error(`[ctxsync] ${config.output} does not exist. run "ctxsync generate`);
        process.exit(1);
        break;
      case "no-cache":
        console.error(
          `[ctxsync] ${config.output} exists but wasn't produced by ctxsync (or its cache was deleted) - cannot verify freshness. run "ctxsync generate`,
        );
        process.exit(1);
        break;
      case "stale":
        console.error(
          `[ctxsync] ${config.output} is stale - ${result.changedCount} file(s) since the last generate. run "ctxsync generate"`,
        );
        process.exit(1);
        break;
      case "up-to-date":
        console.log(`[ctxsync] ${config.output} is up to date`);
        break;
    }
  },
});
