# ctxsync

> Keeps AI agent context files (`AGENTS.md`, `CLAUDE.md`, `.cursorrules`) in sync with your codebase — automatically.

**Status:** early development. Not yet published.

## Install

**Via npm/Bun** (requires [Bun](https://bun.sh) on your machine — the CLI itself runs on Bun):

```bash
bun add -g ctxsync
# or run without installing:
bunx ctxsync generate
```

**Standalone binary** (no Bun/Node required — the runtime is embedded):
download the binary for your platform from the
[latest release](https://github.com/your-username/ctxsync/releases/latest),
make it executable, and put it on your `PATH`:

```bash
chmod +x ctxsync-linux-x64
sudo mv ctxsync-linux-x64 /usr/local/bin/ctxsync
```

## The problem

Every AI coding tool (Claude Code, Cursor, Copilot, ...) now reads some kind of
repo-context file to understand your architecture and conventions. Almost
nobody keeps that file up to date — it's hand-written once, and goes stale
within weeks as the codebase moves on.

`ctxsync` scans your repo, understands its structure and conventions, and
generates/updates that context file for you — so every AI tool you use stays
accurate, without manual upkeep.

## Usage

```bash
ctxsync generate              # generate or incrementally update AGENTS.md
ctxsync generate --dry-run    # print the result instead of writing it
ctxsync generate --force      # ignore the cache, regenerate from scratch
ctxsync generate --watch      # regenerate automatically as files change
ctxsync check                 # CI-friendly: exit 1 if the doc is missing or stale
```

**Note on `--watch`:** don't redirect its output to a log file *inside* the
watched repo (e.g. `ctxsync generate --watch > ctxsync.log`) — the watcher
will see its own log writes as a file change and re-trigger itself. Redirect
outside the repo, or just let it print to your terminal.

## Development

Requires [Bun](https://bun.sh) >= 1.1.

```bash
bun install       # install dependencies
bun run dev        # run the CLI locally
bun test           # run tests
bun run lint        # lint with Biome
bun run typecheck  # type-check with tsc
bun run build       # bundle for distribution
```

## Project structure

```
src/
  cli.ts          # CLI entrypoint (command definitions)
  commands/       # one file per CLI command
  core/           # scanning, LLM calls, file generation logic
  config/         # config schema + loading
test/             # unit + integration tests
```

## License

MIT