# CLAUDE.md

maplace.js is being rewritten from scratch as 1.0. Three documents, one job each:
- `docs/MODERNIZE.md`: context, decisions history, rejected options and the status of every task. Read it first; update a row's status with the work, and add rows rather than new planning files.
- `docs/rfc-1.0.md`: the 1.0 API (frozen).
- This file: how to work in the repo.

## Commands
Node 24 (`.nvmrc`). Scripts in `scripts/` are TypeScript run directly by Node.
- `npm ci`: install; then, once, `npx playwright install chromium` for the browser tests.
- `npm run check`: Biome (lint, format, file length, `google.maps` only in `src/google/`), then `scripts/check.ts`: import layers, RFC ↔ types, MIGRATION's Events table ↔ `api-lists.ts` (its 1.0 event column), the size budgets of RFC §3 Numbers (the builds made in memory with `npm run build`'s options, minified and gzipped; the budgets are read from the RFC table), CHANGELOG, doc links (every relative link in the docs reaches a file) and doc snippets (a fence after `<!-- example: <path> -->` is a copy of that file).
- `npm run sizes`: each budget with what it measures now and the headroom left.
- `npm run coverage`: after `npm test`, the line coverage of the core (what the `maplace` entry loads) and of the package against the floors of RFC §3 Numbers; a CI step.
- `npm run build`: `packages/maplace/dist` (npm ESM and `.d.ts`, the two CDN scripts), then `packages/maplace/packed`, the package as npm packs it (no `maplace:source`).
- `npm run release <version>`: what the release workflow (`.github/workflows/release.yml`, P2) runs first, in this checkout: the version written (manifest, lockfile, `MAPLACE_VERSION`) and the unreleased CHANGELOG lines headed `## <version> (<date>)`, or why the version can't be released; `npm run release-notes <version>` prints that version's GitHub release notes. A local run is a rehearsal: undo it with `git checkout`.
- `npm run typecheck`: source, examples, type tests, then `scripts/`, then the site's `.ts` (`apps/site`).
- `npm test`: Vitest, with a coverage report (`coverage/lcov.info`): the `node` project (node and happy-dom) and the `browser` project (`*.browser.test.ts`, headless Chromium, served from `localhost:63315` when the port is free); `--project <name>` runs one. Tests on real Google Maps run when `VITE_MAPS_KEY` is set (in `.env.local`; the key must allow `http://localhost:63315/*`) and skip otherwise; CI runs them on `next`. The node project also checks the package as npm would pack it (built into temp dirs): publint, attw, and a strict consumer type-check (`scripts/checks/packed-package.test.ts`).
- `npm run fix`: Biome's safe fixes and formatting.
- `npm run site:dev`, `npm run site:build`: the site (`apps/site`, Astro) in dev, or built into `apps/site/dist`. The site pins the CDN scripts it shows to their integrity, hashed from the scripts built in memory as they are published, and links the repo's files at the commit it is built from. CI has no step of its own for the site: `npm test` builds it. `SITE_MAPS_KEY` gives its maps a key (W6's, referrer-restricted); without it `astro build` warns, and a map asked to load says the site has no key. There is no `astro check`: it needs TypeScript 6 or older, so the site's logic lives in `.ts` modules that `npm run typecheck` checks, and its `.astro` files only arrange them.
- `npm run sonar`: SonarQube scan (scope in `sonar-project.properties`, host and token from `.env.local`); it lands on the same main branch as CI's, so use it to check before a push.

CI (`.github/workflows/ci.yml`) runs `check`, `typecheck` and `test` on every push. A tracker row that adds a gate adds its CI step in the same commit. On `next` it also sends the analysis to SonarQube, report-only. On `next`, `npm test` gets the `MAPS_KEY` secret, so the Google tests run on real Maps JS there.

## Layout
- `packages/maplace/src/`: the package. Entries: `index.ts` (core), `google/`, `element/` and `react/` (the React binding, which uses the core through its entry, as the element does).
- `packages/maplace/src/adapter-kit/`: what every adapter draws with; the fake and Google share it, the core entry never imports it.
- `packages/maplace/src/location-state.ts`: a location's state from selection and hover, shared by the adapters and the list view.
- `packages/maplace/src/__typetests__/`: compile-time API tests (`@ts-expect-error` must stay errors) and `api-lists.ts`, the RFC's lists of codes, events and capabilities.
- `packages/maplace/examples/`: the RFC §2 use cases as HTML, vanilla and React snippets; type-checked, never published.
- `scripts/`: repo checks, each in `scripts/checks/` beside its test; the build's definitions in `scripts/build/`, which the size check measures too.
- `apps/site/`: the website (D23, D24). Its logic is in `src/{site,examples,consent,scripts}/*.ts`, tested in the node project, and the consent flow end to end in `test/` (the site built, served, and driven in Chromium with every request off the machine refused). Repo files reach it through Astro's content layer (`src/content.config.ts`), which runs unbundled: a bundled page can't find the repo.
- `README.md`, `MIGRATION.md`, `CHANGELOG.md` at the root: the package's own docs. The README's pinned CDN snippets (`maplace@x.y.z`, `sha384-…`) are filled in when the package is staged; never write real values there.
- `docs/`: the RFC and the tracker. They are deliberately single documents; everything else stays small.

## Rules
- **Clean code**: intention-revealing names, small functions that do one thing, no comments that restate the code. The API's own conventions (arguments, `undefined`, errors) are RFC §3 Rules and Errors.
- **Modules**: one concept per file, 100–200 lines; Biome fails a file over 300 (`biome.json`). Split before a file nears the limit.
- **Browser tests**: what only a real browser shows (layout, scrolling, focus, trusted input, the accessibility tree) goes in a `*.browser.test.ts`; logic stays in node or happy-dom tests. Tests needing real Google Maps go under `src/google/` in `describeWithMaps` (`src/google/testing/`). The examples in `packages/maplace/examples/` run by being there: vanilla scripts and pages on the fake every push, the pages on real Maps on `next`; an example a reader copies is never edited to suit a test.
- **Layers**: what may import what is the `LAYERS` table in `scripts/checks/imports.ts`; a new file under `src/` gets a row there.
- **API changes** follow the RFC header. A new error code, event or capability also goes in `api-lists.ts`; typecheck and `npm run check` then point at anything out of step. Keep the RFC lines `scripts/checks/rfc.ts` reads in their format.
- Private phase: nothing public before the go-public gate (§9 in the tracker): `master`/`main`, npm, the live site and GitHub issues stay untouched. `next` being visible on GitHub is fine.

## Agent workflow
- Work on a short-lived branch, fast-forward merged into `next`. Commit only when asked; no attribution lines in commit messages.
- Before any change merges, run on the branch diff, in order: `/simplify`, then `/code-review`, then `/clean-code` (a user skill; skip it if unavailable and say so). Fix findings, then merge. Documentation-only changes skip the chain.
- After the chain, before committing: `npm run sonar`, then read the quality gate and open issues. A red gate is fixed, or explained to the user, before the change merges; CI's own scan is report-only.
- A fix lands with a test shown failing first.
- A change a reader would notice adds its dated line at the top of `CHANGELOG.md` in the same commit (`- YYYY-MM-DD Added/Changed/Fixed/Removed …`, the verb required, a closed issue as `#N` at the end).
- Commit message style: `[add]`, `[upd]`, `[fix]` prefix, short summary; a commit that closes an issue says `Fixes #N` (the CHANGELOG test, P4 in `docs/MODERNIZE.md`, reads it).
