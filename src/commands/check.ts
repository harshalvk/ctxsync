import { defineCommand } from "citty";
import { loadConfig } from "../config/load.ts";

export const checkCommand = defineCommand({
  meta: {
    name: "check",
    description: "Check whether the context file exists (CI-friendly, exits non-zero on failure).",
  },
  async run() {
    const config = await loadConfig();
    const file = Bun.file(config.output);
    const exists = await file.exists();

    if (!exists) {
      console.error(`[ctxsync] ${config.output} does not exist. Run "ctxsync generate".`);
      process.exit(1);
    }

    console.log(`[ctxsync] ${config.output} exists.`);
    // Staleness detection (diffing against git history) lands in Phase 5.
  },
});
