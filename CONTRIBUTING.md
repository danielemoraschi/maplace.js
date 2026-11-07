# Contributing to Maplace.js

Bug reports, fixes, docs and examples are all welcome. One person maintains this project, so a reply can take a while.

## Before you start

- **A question or an idea** goes in [Discussions](https://github.com/danielemoraschi/maplace.js/discussions).
- **A bug or a feature request** goes in an [issue](https://github.com/danielemoraschi/maplace.js/issues/new/choose), through its form.
- **A security problem** goes in a private report: see [SECURITY.md](SECURITY.md).
- **A small fix** (a bug, a typo, a broken example) can go straight to a pull request.
- **New API or a new feature**: open an issue and wait for a yes first. The API is set in [the RFC](docs/rfc-1.0.md), which also lists [what Maplace.js leaves out](docs/rfc-1.0.md#non-goals-for-10) and why, and the size budgets leave little room, so even a good idea may not fit.

## Setting up

You need the Node version in [`.nvmrc`](.nvmrc).

```bash
npm ci
npx playwright install chromium
```

| Command | What it does |
|---|---|
| `npm run check` | Lint, format, and the repo's own checks: import layers, size budgets, docs, CHANGELOG |
| `npm run fix` | Biome's safe fixes and formatting |
| `npm run typecheck` | Source, examples, scripts and the site |
| `npm test` | Every test, in Node and in headless Chromium |
| `npm run sizes` | Each size budget and the room left in it |
| `npm run site:dev` | The website, with every example running live |

**You don't need a Maps key.** Without one, the tests on real Google Maps skip, and everything else runs, MapLibre's real maps included. Those tests aren't run on a pull request from a fork either, as each map is billed; they run once your change is merged. Please say in your pull request if a change touches `packages/maplace/src/google/` and how you checked it.

## Making a change

- **Fixes** come with a test that fails without the fix.
- **What only a browser shows** (layout, focus, trusted input, the accessibility tree) goes in a `*.browser.test.ts`, starting with the mouse parked (`packages/maplace/src/testing/parked-pointer.ts`); logic stays in node or happy-dom tests.
- **Files** hold one concept each, 100–200 lines; `npm run check` says when one is too long or a new one needs a place in the import layers.
- **Examples** are programs readers copy. Each one is the same map as a page, a script, vanilla TypeScript and React, on each provider it runs on, so a new one comes with all of them. Never change an example to suit a test.
- **API changes** edit [the RFC](docs/rfc-1.0.md) in the same commit as the types. A new error code, event or capability also goes in [`api-lists.ts`](packages/maplace/src/__typetests__/api-lists.ts).
- **`CHANGELOG.md`** gets one line at the top for a change a reader would notice, in the format [its opening](CHANGELOG.md) gives.

## Pull requests

Keep each one to a single change, branched from the default branch, and say `Fixes #N` if it closes an issue.

Contributions are under the project's [Apache-2.0 licence](LICENSE) (section 5). This project has a [code of conduct](CODE_OF_CONDUCT.md).
