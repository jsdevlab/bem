# CLAUDE.md

Project guidance for Claude Code. Read this before changing code.

## Project

`@jsdevlab/bem` — a framework-agnostic BEM (Block, Element, Modifier) class
name builder. Zero runtime dependencies; ships ESM, CJS, and TypeScript
declarations.

- Package: `@jsdevlab/bem` (public on npm)
- Repository: https://github.com/jsdevlab/bem
- Dev runtime: Node.js `>=24.19.0 <27.0.0`, pnpm `12.18.0`
- Build target: Node.js 22 syntax (usable in browsers via any bundler)

## Commands

```bash
pnpm install       # install dependencies
pnpm test          # tsc --noEmit + rstest
pnpm test:watch    # rstest watch mode
pnpm build         # rslib: ESM + CJS + .d.ts into dist/
pnpm check         # biome check --write (mutates files)
pnpm format        # biome format --write
pnpm changeset     # record a changeset for the current change
```

Git hooks: pre-commit runs `pnpm check`; pre-push runs `pnpm format`.

## Layout

- `src/index.ts` — the entire implementation: `bem()`, `block()`, `createBem()`,
  the overload types, and the `sanitize` / `applyNs` / `buildModifiers`
  helpers. Keep the single-file structure unless there is a strong reason to
  split it.
- `tests/index.test.ts` — rstest suite covering the functional, chainable, and
  factory APIs, separators, namespaces, sanitization, and argument detection.
- `rslib.config.ts` — ESM + CJS bundles, `syntax: ['node 22']`, declarations.
- `rstest.config.ts` — reuses the rslib config via `@rstest/adapter-rslib`.
- `biome.json` — lint/format config (2-space indent, single quotes, 80 columns).
- `.changeset/config.json` — Changesets settings (base branch `main`, public npm,
  GitHub changelog for `jsdevlab/bem`).
- `.github/workflows/` — `ci.yml`, `publish.yml`,
  `comment-changesets-pr-status.yml`.
- `README.md` (English, primary) and `README.zh-CN.md` (Chinese) — keep both in
  sync when documenting behavior.

## Public contract

These semantics are the public API contract; changing them is a breaking change.
Update tests and both READMEs when you do.

- Default separators: element `__`, modifier `--`. Modifier order follows object
  key insertion order.
- Modifier values: `true` → bare modifier; `false` / `null` / `undefined` / `''`
  skipped; `0` is emitted (`--key-0`); other values appended as
  `--key-value`.
- Arguments after the block name are detected by type: `string` = element,
  object with a string `el` / `mod` / `ns` property = options, any other object
  = modifiers. Legacy `undefined` placeholders remain supported.
- Sanitization: whitespace runs become `-`; characters outside
  `[a-zA-Z0-9_-]` are removed. An empty modifier key is skipped; an empty
  modifier value degrades to the boolean form.
- Namespace prefixing is idempotent (`hl-card` is not prefixed again).

## Toolchain constraints

- **pnpm 12 records `devEngines.runtime` in the lockfile.** Keep the version a
  **single comparator range** (`>=24.19.0 <27.0.0`):
  - a compound range (`^24.19.0 || ^26.0.0`) makes
    `pnpm install --frozen-lockfile` fail with `ERR_PNPM_OUTDATED_LOCKFILE`;
  - an exact pin makes npm 11 fail with `EBADDEVENGINES` on Node 26.
- After editing `devEngines`, regenerate the lockfile with
  `pnpm install --lockfile-only`, then verify with
  `CI=true pnpm install --no-runtime --frozen-lockfile`.
- GitHub Actions are pinned to full commit SHAs with a version comment. Update
  the SHA and the comment together; do not use floating tags.
- Do not add a custom `script` to `changesets/action/publish`: it publishes from
  a checkout without `dist/` and the tarball loses the build output (see the
  comment in `publish.yml`).
- Shipped files are whitelisted in `package.json#files` (`dist` and both
  READMEs). Add any new published files there.
- Releases use Changesets. Add a changeset for user-visible changes; `main` is
  versioned/published automatically via trusted publishing.

## Verification

Before finishing any change, run:

```bash
pnpm check && pnpm test && pnpm build
```
