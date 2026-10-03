# maplace.js modernization

Single source of truth for the 1.0 rewrite. Read this first; it is written to be enough on its own. Lives in `docs/` with the RFC and future decisions/specs.

Now: decisions done (D1–D21). Next: A0 (triage old issues) and F1–F4 (minimal tooling, so A3 type tests run), then A1 → A2 ⇄ A3 (iterate together) → A4 → A6 → A5.
Status: do | wip | done | later (after 1.0) | wont (never)
Target: maplace as if written from scratch in 2026. Headless core + adapter contract, Google adapter first, MapLibre next, views for HTML/vanilla/React, all designed together.
1.0 = core + Google adapter + `<maplace-map>` (CDN/HTML drop-in first). React subpath ships in 1.x (marked experimental until then).
Critical path: 0 → F1–F4 → 1 (API RFC) → F5–F6 → 3 → 4 ∥ 5 → 7 (1.0.0-beta) → 8 → P9 (1.0). Tests (6) run alongside 3–5, never after.

## How to work this file
- Update a row's status in the same commit/session as the work. New rows take the next free number in their section; never renumber.
- Until A5: decisions live here. After A5 freezes `docs/rfc-1.0.md`: API decisions live in the RFC; this file keeps status and links only.
- Outputs: A1–A4 are sections of `docs/rfc-1.0.md`; A2 snippets and the A3 `.d.ts` sit beside it in `docs/rfc/` until F3 creates `packages/maplace`; A6 spike on branch `spike/maplibre`, deleted after A5.
- Branches: short-lived branch per change, fast-forward merged to `main` (wavelace convention). Commit only when asked.
- Review chain, every change before merge, on the branch diff: `/simplify` (built-in, applies cleanups) → `/code-review` (built-in, findings) → `/clean-code` (user skill in `~/.claude/skills/clean-code`). Fix findings, then merge.
- Old code: `src/maplace.js` and `website/` stay until F2/F3 replace them; `legacy/0.2` keeps them forever.

## Where things are (as of 0.2.10, 2017)
- `src/maplace.js`: the whole library (1,133 lines, jQuery, UMD). Grunt builds `dist/` (gitignored). Line refs `L…` below mean this file at tag `v0.2.10`.
- Website: remote branch `origin/website` (static HTML via Grunt partials, Foundation 3, jQuery 1.9); sources in `website/` on master; demo init in `website/javascripts/app.js`.
- Unmerged `origin/develop`: 9 commits from 2017 (D11).
- Old API reference: README tables (options, methods, events). Issue refs like #154 are github.com/danielemoraschi/maplace.js.
- Default branch is `master` (rename in F1c). maplacejs.com: GoDaddy, expires 2027-02-25, DNS on Cloudflare.

## Conventions (borrowed from danielemoraschi/wavelace, a private repo; the rules are restated here so access isn't needed)
- Tooling stays simple: plain npm, few deps, no framework where a script will do.
- CHANGELOG.md: one dated line (`- YYYY-MM-DD Added/Fixed/Changed …`) per change a reader would notice, at the top, in the same commit; a closed issue as `#N` at the line end. A test reads git history and fails if a commit that closes an issue has no line. The site renders it at `/changelog`.
- Releases: manual GitHub Actions dispatch with a version; refused unless above every released version; pre-releases only to dist-tag `next`; workflow tags `v<version>` and publishes with npm provenance.
- Deploys: every push builds; `main` → production, other branches → Cloudflare preview alias named after the branch.
- Offsite check: a script fetches live pages like a browser and fails if anything loads from an origin not on the allowlist; runs after each deploy and daily (Cloudflare can inject scripts the build never sees).
- Docs examples are executed by tests, so docs can't drift. A fix lands with a test shown failing first.

Sources for D5–D8: developers.google.com/maps/documentation/javascript/ `advanced-markers/migration`, `cloud-customization/troubleshoot` (map ID + JSON styles), `routes/route-class-overview`, `releases` (Routes JS dates); github.com/googlemaps/js-api-loader issue #1083 (importLibrary right after setOptions).

## Rejected (don't re-propose without new information)
| Option | Why not |
|--------|---------|
| pnpm, Turborepo | user prefers plain npm; no benefit at one package + one site |
| `@maplace/*` scoped split | core is useless without an adapter (two installs for anything); per-package versions are overhead for one maintainer; npm org needed |
| tsup/tsdown, Vite lib mode, Rollup | esbuild + tsc is two well-known tools and a short script (wavelace-style) |
| ESLint + Prettier | two tools and more config; Biome does both |
| `node --test` | would need hand-rolled DOM mocks, coverage and browser mode; Vitest has them |
| Changesets, semantic-release | wavelace-style manual dispatch + hand-written changelog preferred |
| Hand-rolled site build, Vite MPA, Starlight/VitePress | Astro gives MDX docs + islands (React examples later) with one dependency |
| Own Worker analytics, Plausible, GA | user chose Cloudflare Web Analytics: zero code, cookieless (listed on the privacy page; allowed before consent since it sets no cookie) |
| Per-map consent, banner-only | per-map is too much friction on an examples site; banner-only doesn't gate Google's cookies |
| Legacy `google.maps.Marker`, JSON `styles`, no-mapId fallback | Marker deprecated (2024); JSON styles ignored with a mapId; a fallback means two code paths |
| `DirectionsService` | legacy, replaced by Routes JS `Route`; risk accepted that Routes JS is young (weekly channel since 2025-10-23) |
| Bundling DOMPurify, Trusted Types | size, and the user picks their own sanitizer; text-by-default makes most data safe without one |
| Merging `develop`, its `this.scope` refactor | moot after the rewrite |
| React in 1.0 | 0.2's audience was script-tag users; `<maplace-map>` already works in React 19; React adds JSX content later |
| Providers other than Google/MapLibre, Vue/Svelte wrappers, 0.2 compat shim | scope; the element covers other frameworks; MIGRATION.md covers 0.2 |

## 0. Decisions
| # | Item | Status | Note |
|---|------|--------|------|
| D1 | v1.0 = rewrite, breaking API | done | camelCase; MIGRATION.md |
| D2 | TypeScript strict, ESM-first, evergreen only | done | target ES2020 (evergreen floor, no transpile bloat); no IE |
| D3 | npm workspaces | done | two workspaces: `packages/maplace` and `apps/site`, so the site uses the local package; plain npm |
| D4 | npm name = `maplace` (unscoped, free as of 2026-10-03) | done | old `maplace-js` → deprecate (N5) |
| D5 | Maps loading | done | lib calls global `google.maps.importLibrary` (works with Google bootstrap and js-api-loader v2; no loader peer dep); only `<maplace-map>` accepts `api-key` and injects Google's bootstrap if Maps isn't loaded; never reads `google` at import |
| D6 | Google markers = AdvancedMarkerElement only | done | mapId required (DEMO_MAP_ID for dev/tests) |
| D7 | Google styling = mapId + Cloud Console only | done | `styles` dropped (JSON styles ignored with mapId, docs-verified); `colorScheme` via `google` options |
| D8 | Google routing = Routes JS `Route.computeRoutes` | done | beta 2025-08-21 (3.62.1), weekly channel 2025-10-23 (3.62.11d); `createPolylines` + own stop markers; `directions_panel` dropped; route is a Google-adapter capability, not a core type |
| D9 | Tooling = esbuild + tsc, Biome, Vitest, GH Actions | done | esbuild bundles ESM + IIFE, tsc emits .d.ts; Biome lint+format; Vitest unit + browser mode (T2) |
| D10 | Site = Astro + MDX, static, on Cloudflare Workers static assets | done | maplacejs.com: GoDaddy (expires 2027-02-25), NS already Cloudflare → attach custom domain |
| D11 | `origin/develop` = mine, then delete | done | onPolylineClick + #154 trigger docs; `this.scope` refactor and FreezeZoom/UnFreezeZoom TODO stubs → drop; all recorded in A4; delete in F1b |
| D12 | Analytics = Cloudflare Web Analytics; consent = site-wide one-time for Google Maps | done | maps behind placeholder + 'Load Google Maps', remembered in localStorage, revocable from footer |
| D13 | Positioning | done | value = "a list of locations → map + synced list/menu in ~5 lines"; anything not serving that is cut. Short answer to "why not `<gmp-map>` / `@vis.gl/react-google-maps`?": they render maps, maplace turns a data list into map + synced list with selection; full answer in A1 |
| D14 | Architecture = headless core + adapter + views | done | core: state only (locations, selection, viewport), no DOM, no provider; adapter renders state; views (list/menu) optional and replaceable |
| D15 | Locations keyed by `id` | done | `setLocations(next)` diffs by id; select/show/remove by id; no index-based API |
| D16 | One typed event system | done | `on(event, fn)` returning unsubscribe; includes `error`; no before/after callback pairs, no callback options |
| D17 | Bindings designed with the core | done | React + Web Component usage written in the RFC first; element ships in 1.0, React in 1.x |
| D18 | One package, subpath exports | done | `maplace` (core + adapter contract), `maplace/google`, `maplace/element`, `maplace/react` (1.x), later `maplace/maplibre`; one version, one tag `v<version>`; react, markerclusterer, maplibre-gl as optional peers; element CDN IIFE bundles the Google adapter, ESM element takes an adapter |
| D19 | 1.0 scope | done | core + Google adapter + element. Post-1.0: React (1.x), long lists (V2), playground, MapLibre adapter |
| D20 | Content model | done | `content`: string (rendered as text) \| Node \| `(loc) => Node`; explicit `html` opt-in through a user-supplied `sanitize` hook (docs show DOMPurify); element supports `<template>` per location; keeps 0.2-style JSON data working |
| D21 | MapLibre-ready from day one (very likely after 1.0) | done | adding it = new adapter, no rewrite. No provider types outside the adapter (own `LatLng`, bounds, padding, payloads; content = DOM Node, which both accept). Neutral options top-level (center, zoom, fit padding); provider options under `google: {…}` / `maplibre: {…}`. Adapter contract in core: mount, apply diff, viewport, fit, events, destroy, `capabilities`. Capabilities for what differs: route (Google only), clustering (markerclusterer vs MapLibre GeoJSON clustering), circle (native vs polygon), editable shapes (native vs plugin/none); unsupported → `error`. Load/consent states neutral |

## 1. API RFC
| # | Item | Status | Note |
|---|------|--------|------|
| A0 | Triage old GitHub issues/PRs | do | feeds A4 (what users asked for, what broke) |
| A1 | Positioning doc | do | the 5-line promise, target users, explicit non-goals, comparison with `<gmp-map>` (Google's web components), `@vis.gl/react-google-maps`, Places UI Kit (Google's ready-made place widgets) |
| A2 | Use cases as code first | do | iterate with A3. 10 scenarios × HTML (`<maplace-map>`), vanilla JS, React: simple, markers, circles, menu, tabs (= list + details panel driven by select event), polyline, polygon, route, mixed (= markers + circles, plus locations loaded async from JSON), big (= 4k points; targets set in A3). Snippets must type-check against A3 |
| A3 | Public API as `.d.ts` | do | core store (`subscribe`/`getSnapshot`, `setLocations`, `select`, `fitAll`, `destroy`), `Location` (id-keyed union), event map incl. `error`, load states, adapter contract + capabilities, view contract (how a view reads the store and requests selection); numbers: size budget per subpath, coverage threshold; type tests from day one. Also: glossary (location, selection, viewport, adapter, view, capability; verbs for methods, `is`/`has` for booleans, no near-duplicates — 0.2 had `show_infowindow` vs `show_infowindows`, `commons` vs `shared`); error policy (misuse such as bad args or duplicate id throws; runtime/provider failures emit `error`; no null returns, no swallowed errors — 0.2 L866); API shape (≤2 positional args, then an options object; one way to do each thing) |
| A4 | 0.2 → 1.0 inventory | do | every option/method/event from README + develop → keep / changed / dropped. Model changes spelled out: polyline/polygon/route vertices are no longer list entries; `html` string → D20; develop-only items (D11). Feeds MIGRATION.md |
| A5 | Review and freeze RFC | do | `docs/rfc-1.0.md`, self-contained and public (must not depend on this file); changes after freeze go through it |
| A6 | MapLibre spike (before A5) | do | throwaway: markers, polyline, select, fit against the draft contract; any provider leak into core fixed in the RFC |

## 2. Foundation
| # | Item | Status | Note |
|---|------|--------|------|
| F0 | Claim `maplace` on npm | do | user does it (needs their npm account): publish a `0.0.0-next.0` placeholder under dist-tag `next`; urgent, name was free on 2026-10-03; blocks P2 |
| F1 | Branch `legacy/0.2` from master | do | tag v0.2.10 exists |
| F1b | Prune stale remote branches | do | `0.1.2`, `0.1.3`, `0.2.0`, `0.2-stable`, `develop` (after A4); tags stay; `website` waits for W11 |
| F1c | Rename `master` → `main` | do | wavelace convention; W10 and T2 assume it; GitHub redirects |
| F1d | "1.0 rewrite in progress" notice on README | do | repo looks abandoned otherwise |
| F1e | (moved to A0) | done | |
| F2 | Remove Grunt, Bower, Travis, jscs, jshint | do | Gruntfile.js, bower.json, .travis.yml, .jscsrc |
| F3 | npm workspaces, `.nvmrc` (LTS), `engines`, `.editorconfig` | do | packages/maplace (subpaths per D18), apps/site |
| F4 | tsconfig strict + Biome | do | cognitive-complexity rule on; file-size guideline goes in CLAUDE.md (F6) |
| F5 | CI: lint, typecheck, unit, fake-adapter tests, build, publint, attw, size budget, import boundaries (T10) | do | gates from first commit, not added later |
| F6 | Repo `CLAUDE.md` | do | once the new layout exists: commands, layout, file-size guideline, and everything in this file's header; this file's header then shrinks to a pointer |
| F7 | Renew maplacejs.com | do | expires 2027-02-25 (GoDaddy); consider transferring to Cloudflare Registrar |

## 3. Core (headless)
| # | Item | Status | Note |
|---|------|--------|------|
| C1 | Store | do | locations, selection, viewport intent; `subscribe`/`getSnapshot` (works with `useSyncExternalStore`); immutable snapshots |
| C2 | Id-keyed locations + diffing | do | `setLocations(next)` yields added/updated/removed; adapters apply only the diff |
| C3 | Location types | do | marker, circle, polyline, polygon as a discriminated union; per-location overrides; route lives in the Google adapter (D8) |
| C4 | Typed events | do | select, hover, drag, edit, error; unsubscribe fn; AbortSignal support |
| C5 | Lifecycle | do | `destroy()`, AbortSignal, many instances, nothing global, SSR-safe import |
| C6 | Tree-shakable | do | each subpath and location type independently importable; `sideEffects: false` |
| C7 | 0.2 bug scenarios as tests | do | anchored to tag v0.2.10 (permalinks): shared controls (L257), maxZIndex (L349), edit callbacks (L529), control removal (L866), AddControl (L937), onPolylineClick; each becomes a regression test the design makes impossible |

## 4. Google adapter (first implementation of the contract, `maplace/google`)
| # | Item | Status | Note |
|---|------|--------|------|
| G1 | Attach to a map | do | `importLibrary` for maps/marker/routes on demand; accepts an existing `google.maps.Map` or creates one from `google: {…}` options |
| G2 | Markers | do | AdvancedMarkerElement; content per D20; `gmpClickable`, keyboard focus, titles |
| G3 | Shapes | do | circle, polyline, polygon; draggable/editable reported as typed events |
| G4 | Info window | do | content per D20; XSS-safe by default |
| G5 | Fit all / pan / zoom | do | from store viewport intent |
| G6 | Route capability | do | D8 |
| G7 | Clustering capability | do | lazy-imports `@googlemaps/markerclusterer` (optional peer); "big" is the benchmark |
| G8 | On-map controls | do | views mounted via `map.controls[position]` |
| G9 | Load + error states | do | missing/invalid key or mapId, quota, library load failure → `error` event + state |

## 5. Views and bindings (parallel to 4)
| # | Item | Status | Note |
|---|------|--------|------|
| V1 | List + select views (vanilla) | do | accessible (listbox/aria-selected, keyboard, native `<select>`); synced to store selection; render function override |
| V2 | Long lists | later | virtualise or paginate (D19) |
| V3 | `<maplace-map>` Web Component | do | attributes + `locations` property + child `<maplace-location>` + `<template>` content; `api-key` (D5); DOM events; works in React 19 as-is; CDN IIFE |
| V4 | React: provider + components | later | 1.x: `<Maplace locations>` with `<Map/>`, `<LocationList/>`, `<Marker>` children; hooks via `useSyncExternalStore` |
| V5 | React content in markers/info windows | later | 1.x: portals into marker content; JSX, no HTML strings |
| V6 | React SSR + RSC | later | 1.x: no window at import; `"use client"` where state lives |
| V7 | Load states | do | idle / loading / ready / error exposed to views and sites (site W8 gates on it) |

## 6. Tests (alongside 3–5)
| # | Item | Status | Note |
|---|------|--------|------|
| T1 | Core unit tests | do | pure logic, no DOM, no provider mocks |
| T2 | Adapter + views in Vitest browser mode | do | fake adapter (in-memory implementation of the adapter contract that records calls; no DOM map, no provider) = required PR gate; real Maps (referrer-restricted key + DEMO_MAP_ID secret) nightly and on `main` only (fork PRs get no secrets) |
| T3 | Type tests | do | `expectTypeOf` on public API (A3) |
| T4 | Package checks | do | publint + attw in CI |
| T5 | Docs examples executed | do | fake adapter on PRs, real Maps nightly; docs can't drift (as wavelace) |
| T6 | E2E on site examples | do | Playwright, consent flow included; nightly |
| T7 | A fix lands with a test shown failing first | do | convention, as wavelace |
| T8 | Coverage gate | do | threshold from RFC (A3) |
| T9 | Adapter conformance suite | do | one shared contract test set run against fake, Google, later MapLibre adapters; fake adapter keeps the contract honest from day one |
| T10 | Import boundaries check | do | Biome restricted imports or CI grep: no `google.maps` outside `maplace/google` (later same for maplibre); views import only the store, never an adapter; adapters never import views |

## 7. Package and release
| # | Item | Status | Note |
|---|------|--------|------|
| P1 | Builds | do | per-subpath ESM + .d.ts; IIFE for `maplace/element` (bundles Google adapter); `exports` map, `sideEffects: false`, `files` |
| P2 | Release workflow (wavelace-style) | do | manual dispatch with version; refuse not-above-last; pre-release only to dist-tag `next`; tag `v<version>`; tag publishes w/ provenance |
| P3 | Size budget per subpath | do | size-limit in CI; numbers from RFC (A3) |
| P4 | CHANGELOG.md convention (wavelace-style) | do | one dated line per reader-visible change, same commit, `#N` for closed issue; test refuses a closing commit not listed; seed with 0.x history |
| P5 | Release notes from CHANGELOG lines since last tag | do | GitHub release body from P2 |
| P6 | README rewrite | do | leads with the CDN `<maplace-map>` 5-liner; then vanilla; CDN via jsDelivr/unpkg |
| P7 | MIGRATION.md 0.2 → 1.0 | do | from A4 |
| P8 | Publish 1.0.0-beta | do | dist-tag `next` |
| P9 | Publish 1.0.0 | do | core + Google adapter + element, after site (W) is live with docs |

## 8. Website
| # | Item | Status | Note |
|---|------|--------|------|
| W1 | apps/site (Astro + MDX) | do | docs from the RFC, not from old partials |
| W2 | Examples | do | HTML + vanilla per A2 scenario for 1.0; React examples in 1.x; route replaces directions, styled becomes cloud-styled mapId |
| W3 | Fusion example | wont | API dead |
| W4 | `ajax.php` → static JSON | do | |
| W5 | (moved to N4, playground) | done | |
| W6 | Referrer-restricted demo key + mapId | do | |
| W7 | Cloudflare Web Analytics | do | D12 |
| W8 | Maps consent gate | do | D12; built on V7 |
| W9 | Privacy page | do | covers CF analytics + Google Maps |
| W10 | Deploy from CI + custom domain | do | wrangler-action: main → prod, other branches → preview alias |
| W10b | `/changelog` from CHANGELOG.md | do | at build time |
| W10c | Offsite check | do | allowlist: cloudflareinsights before consent, Google Maps only after; daily cron |
| W11 | Delete `website` branch | do | after W10 live |

## Post-1.0
| # | Item | Status | Note |
|---|------|--------|------|
| N1 | React binding release (V4–V6) | later | 1.x |
| N2 | Long lists (V2) | later | virtualise or paginate; "big" benchmark |
| N3 | `maplace/maplibre` adapter | later | very likely; ready per D21, contract proven by A6 + T9 |
| N4 | Live playground | later | editable examples (StackBlitz or in-page) |
| N5 | `npm deprecate maplace-js` → "moved to maplace" | later | after 1.0 |
| N6 | TypeDoc API reference | later | the RFC + examples matter more |
| N7 | Geocoded address locations | later | adapter capability |
| N8 | 0.2 options compat shim | wont | MIGRATION.md is enough |
| N9 | Vue/Svelte wrappers | wont | Web Component covers them |
