# ctxsync

> Keeps AI agent context files (`AGENTS.md`, `CLAUDE.md`, `.cursorrules`) in sync with your codebase — automatically.

**Status:** early development. Not yet published.

## The problem

Every AI coding tool (Claude Code, Cursor, Copilot, ...) now reads some kind of
repo-context file to understand your architecture and conventions. Almost
nobody keeps that file up to date — it's hand-written once, and goes stale
within weeks as the codebase moves on.

`ctxsync` scans your repo, understands its structure and conventions, and
generates/updates that context file for you — so every AI tool you use stays
accurate, without manual upkeep.

## Development

```bash
bun install         # install dependencies
bun run dev          # run the CLI locally
bun test             # run tests
bun run lint          # lint with Biome
bun run typecheck    # type-check with tsc
bun run build         # bundle for distribution
```

## License

MIT
