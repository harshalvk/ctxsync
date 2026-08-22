import { defineCommand } from "citty";
import { loadConfig } from "../config/load.ts";
import { color } from "../core/colors.ts";
import { checkContextFile } from "../core/status.ts";

export const checkCommand = defineCommand({
  meta: {
    name: "check",
    description: "Check whether the context file exists and is up to date (CI-friendly).",
  },
  async run() {
    const config = await loadConfig();
    const result = await checkContextFile(config);

    switch (result.status) {
      case "missing":
        console.error(color.red(`✗ ${config.output} does not exist. Run "ctxsync generate".`));
        process.exit(1);
        break;

      case "no-cache":
        console.error(
          color.red(
            `✗ ${config.output} exists but wasn't produced by ctxsync (or its cache was deleted) — cannot verify freshness. Run "ctxsync generate".`,
          ),
        );
        process.exit(1);
        break;

      case "stale":
        console.error(
          color.red(
            `✗ ${config.output} is stale — ${result.changedCount} file(s) changed since the last generate. Run "ctxsync generate".`,
          ),
        );
        process.exit(1);
        break;

      case "up-to-date":
        console.log(color.green(`✓ ${config.output} is up to date.`));
        break;
    }
  },
});
