# Contributing

## Making a change

1. Make your change, with tests.
2. Describe it for the changelog:

```bash
   bun run changeset
```

This asks which kind of bump it is (patch/minor/major) and for a short
description. It writes a markdown file into `.changeset/` — commit that
file alongside your change. 3. Open a PR. Once merged to `main`, CI takes over automatically.

## What happens after merge

- If your PR included a changeset, CI opens (or updates) a **"Version
  Packages"** pull request that bumps `package.json` and updates
  `CHANGELOG.md`. It stays open, accumulating further changesets, until
  someone merges it.
- Merging the **Version Packages PR** triggers the actual release:
  1. `bun run release` builds the package and publishes it to npm.
  2. Standalone binaries are built for Linux/macOS/Windows.
  3. A GitHub Release is created with those binaries attached.

You never run `npm publish` or create a GitHub Release by hand — the
Version Packages PR is the trigger, and merging it is a deliberate,
reviewable decision.

## One-time repository setup

1. **Add an `NPM_TOKEN` secret** (Settings → Secrets and variables →
   Actions).
2. **Allow Actions to open PRs** (Settings → Actions → General → Workflow
   permissions) — enable "Allow GitHub Actions to create and approve pull
   requests."
