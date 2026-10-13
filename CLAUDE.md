# CLAUDE.md

maplace.js is being rewritten from scratch as 1.0. Three documents, one job each:
- `docs/MODERNIZE.md`: context, decisions history, rejected options and the status of every task. Read it first; update a row's status with the work, and add rows rather than new planning files.
- `docs/rfc-1.0.md`: the 1.0 API (frozen).
- This file: how to work in the repo.

## Commands
Node 24 (`.nvmrc`). Scripts in `scripts/` are TypeScript run directly by Node.
- `npm ci`: install; then, once, `npx playwright install chromium` for the browser tests.
- `npm run check`: Biome (lint, format, file length, `google.maps` only in `src/google/`), then `scripts/check.ts`: import layers and RFC ↔ types.
- `npm run typecheck`: source, examples, type tests, then `scripts/`.
- `npm test`: Vitest, with a coverage report (`coverage/lcov.info`): the `node` project (node and happy-dom) and the `browser` project (`*.browser.test.ts`, headless Chromium); `--project <name>` runs one.
- `npm run fix`: Biome's safe fixes and formatting.
- `npm run sonar`: SonarQube scan (scope in `sonar-project.properties`, host and token from `.env.local`); it lands on the same main branch as CI's, so use it to check before a push.

CI (`.github/workflows/ci.yml`) runs `check`, `typecheck` and `test` on every push. A tracker row that adds a gate adds its CI step in the same commit. On `next` it also sends the analysis to SonarQube, report-only.

## Layout
- `packages/maplace/src/`: the package. Entries: `index.ts` (core), `google/`, `element/`, and `react/`, a type-only 1.x draft that stays out of the published `exports`.
- `packages/maplace/src/__typetests__/`: compile-time API tests (`@ts-expect-error` must stay errors) and `api-lists.ts`, the RFC's lists of codes, events and capabilities.
- `packages/maplace/examples/`: the RFC §2 use cases as HTML, vanilla and React snippets; type-checked, never published.
- `scripts/`: repo checks, each in `scripts/checks/` beside its test.
- `docs/`: the RFC and the tracker. They are deliberately single documents; everything else stays small.

## Rules
- **Clean code**: intention-revealing names, small functions that do one thing, no comments that restate the code. The API's own conventions (arguments, `undefined`, errors) are RFC §3 Rules and Errors.
- **Modules**: one concept per file, 100–200 lines; Biome fails a file over 300 (`biome.json`). Split before a file nears the limit.
- **Browser tests**: what only a real browser shows (layout, scrolling, focus, trusted input, the accessibility tree) goes in a `*.browser.test.ts`; logic stays in node or happy-dom tests.
- **Layers**: what may import what is the `LAYERS` table in `scripts/checks/imports.ts`; a new file under `src/` gets a row there.
- **API changes** follow the RFC header. A new error code, event or capability also goes in `api-lists.ts`; typecheck and `npm run check` then point at anything out of step. Keep the RFC lines `scripts/checks/rfc.ts` reads in their format.
- Private phase: nothing public before the go-public gate (§9 in the tracker): `master`/`main`, npm, the live site and GitHub issues stay untouched. `next` being visible on GitHub is fine.

## Agent workflow
- Work on a short-lived branch, fast-forward merged into `next`. Commit only when asked; no attribution lines in commit messages.
- Before any change merges, run on the branch diff, in order: `/simplify`, then `/code-review`, then `/clean-code` (a user skill; skip it if unavailable and say so). Fix findings, then merge. Documentation-only changes skip the chain.
- A fix lands with a test shown failing first.
- Commit message style: `[add]`, `[upd]`, `[fix]` prefix, short summary; a commit that closes an issue says `Fixes #N` (the CHANGELOG test, P4 in `docs/MODERNIZE.md`, reads it).
