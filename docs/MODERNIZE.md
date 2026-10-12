# maplace.js modernization

Single source of truth for the 1.0 rewrite. Read this first; it is written to be enough on its own. Lives in `docs/` with the RFC and future decisions/specs.

Now: API RFC frozen (A0–A7). Next: F5–F6, then C1–C8 with T1–T3.
Status: do | wip | done | later (after 1.0) | wont (never)
Target: maplace as if written from scratch in 2026. Headless core + adapter contract, Google adapter first, MapLibre next, views for HTML/vanilla (1.0) and React (usage designed now in the RFC, shipped in 1.x).
1.0 = core + Google adapter + `<maplace-map>` (CDN/HTML drop-in first). `maplace/react` is not in the 1.0 `exports` map (no semver promise); it arrives in 1.x.
Critical path: 0 → 1 (API RFC) → F5–F6 → 3 → 4 ∥ 5 → 7 (P1–P7) → 8 (on preview) → 9 (go-public gate, 1.0.0). Tests (6) run alongside 3–5, never after.

## How to work this file
- Private phase: all work lives on the long-lived branch `next` (pushed to origin; short-lived branches fast-forward into it). Nothing public before §9: `master`/`main` untouched, no npm publish, no production site, no README notice, no issue activity. A branch being visible on GitHub is fine.
- Update a row's status in the same commit/session as the work. New rows take the next free number in their section; never renumber.
- API decisions live in `docs/rfc-1.0.md` (frozen 2026-10-12): an API change edits the RFC in the same commit as the types. This file keeps status and links; its decision rows are history.
- Outputs: A1–A4 are RFC §1–§4; A2 snippets live in `packages/maplace/examples/` (outside `src/`, not in `files`, so never published) and the A3 `.d.ts` in `packages/maplace/src/` (F3 precedes the RFC) so both type-check; React snippets type-check against a type-only draft of `maplace/react` that stays out of `exports`; the RFC links to them. A6/A7 spike code and bench were on branch `spike/a6-a7`, deleted after the freeze; their results are in RFC §3 Performance.
- Branching, commits and the review chain: see `CLAUDE.md`.
- Old code: removed from `next` in F2; read it with `git show 0.2.10:<path>`; `legacy/0.2` (R1) keeps it forever.

## Where 0.2 things are (tag `0.2.10`; removed from `next` in F2)
- `src/maplace.js`: the whole library (1,133 lines, jQuery, UMD). Grunt builds `dist/` (gitignored). Line refs `L…` below mean this file at tag `0.2.10`.
- Website: remote branch `origin/website` (static HTML via Grunt partials, Foundation 3, jQuery 1.9); sources in `website/` on master; demo init in `website/javascripts/app.js`.
- Tags mix styles: `v0.1.x` and `0.2.x` (no `v`). The `0.2.10` release commit (d51ada2) is not on master; master only adds a README commit after it.
- Unmerged `origin/develop`: 9 commits from 2017 (D11).
- Old API reference: README tables (options, methods, events). Issue refs like #154 are github.com/danielemoraschi/maplace.js.
- Default branch is `master` (rename in R3). maplacejs.com: GoDaddy, expires 2027-02-25, DNS on Cloudflare.

## Conventions
- Tooling stays simple: plain npm, few deps, no framework where a script will do.
- CHANGELOG.md: one dated line (`- YYYY-MM-DD Added/Fixed/Changed …`) per change a reader would notice, at the top, in the same commit; a closed issue as `#N` at the line end. A test reads git history and fails if a commit that closes an issue has no line (keywords and baseline in P4). The site renders it at `/changelog`.
- Releases: manual GitHub Actions dispatch with a version; refused unless above every released version (P2); pre-releases only to dist-tag `next`; workflow tags `v<version>` and publishes via npm trusted publishing (GitHub OIDC, no `NPM_TOKEN`; needs npm ≥ 11.5.1, i.e. current Node LTS; provenance is automatic). Checkout uses `fetch-depth: 0` (the CHANGELOG test reads history). The first release (1.0.0) is manual (R2); P2 takes over after R3, since dispatch and schedules only run from the default branch.
- Deploys: every push builds; branches → Cloudflare preview alias named after the branch (noindex); production from `main` only after R4.
- Offsite check: a script fetches live pages like a browser and fails if anything loads from an origin not on the allowlist; runs after each production deploy and daily once R3/R4 are done (Cloudflare can inject scripts the build never sees).
- Docs examples are executed by tests, so docs can't drift. A fix lands with a test shown failing first.

Sources for D5–D8: developers.google.com/maps/documentation/javascript/ `advanced-markers/migration`, `cloud-customization/troubleshoot` (map ID + JSON styles), `routes/route-class-overview`, `releases` (Routes JS dates); github.com/googlemaps/js-api-loader issue #1083 (importLibrary right after setOptions).

## Rejected (don't re-propose without new information)
| Option | Why not |
|--------|---------|
| pnpm, Turborepo | user prefers plain npm; no benefit at one package + one site |
| `@maplace/*` scoped split | core is useless without an adapter (two installs for anything); per-package versions are overhead for one maintainer; npm org needed |
| tsup/tsdown, Vite lib mode, Rollup | esbuild + tsc is two well-known tools and a short script |
| ESLint + Prettier | two tools and more config; Biome does both |
| `node --test` | would need hand-rolled DOM mocks, coverage and browser mode; Vitest has them |
| Changesets, semantic-release | manual dispatch + hand-written changelog preferred |
| Hand-rolled site build, Vite MPA, Starlight/VitePress | Astro gives MDX docs + islands (React examples later) with one dependency |
| Own Worker analytics, Plausible, GA | user chose Cloudflare Web Analytics: zero code, cookieless (listed on the privacy page; allowed before consent since it sets no cookie) |
| Per-map consent, banner-only | per-map is too much friction on an examples site; banner-only doesn't gate Google's cookies |
| Legacy `google.maps.Marker`, JSON `styles`, no-mapId fallback | Marker deprecated (2024); JSON styles ignored with a mapId; a fallback means two code paths |
| `DirectionsService` | legacy, replaced by Routes JS `Route`; risk accepted that Routes JS is young (weekly 2025-10-23, now also in quarterly) |
| Bundling DOMPurify, Trusted Types | size, and the user picks their own sanitizer; text-by-default makes most data safe without one |
| Merging `develop`, its `this.scope` refactor | moot after the rewrite |
| Public beta, README "rewrite in progress" notice, early npm placeholder | nothing public until stable (user); beta testing is private (R0) |
| React in 1.0 | 0.2's audience was script-tag users; `<maplace-map>` already works in React 19; React adds JSX content later |
| Several routes per map, route alternatives | D22 keeps one route per map (A0: #78, #177) |
| Built-in traffic/bicycling/KML layers, distance matrix, drawing, print | add them to the user's own map (G1) or use Google APIs directly; beyond a location/route manager (A0). Places is not rejected: N12 |
| Providers other than Google/MapLibre, Vue/Svelte wrappers, 0.2 compat shim | scope; the element covers other frameworks; MIGRATION.md covers 0.2 |

## 0. Decisions
History up to the RFC freeze (2026-10-12): where a row and the RFC differ, the RFC wins; new API decisions go to the RFC, not here.

| # | Item | Status | Note |
|---|------|--------|------|
| D1 | v1.0 = rewrite, breaking API | done | camelCase; MIGRATION.md |
| D2 | TypeScript strict, ESM-first, evergreen only | done | target ES2020 (evergreen floor, no transpile bloat); no IE |
| D3 | npm workspaces | done | two workspaces: `packages/maplace` and `apps/site`, so the site uses the local package; plain npm |
| D4 | npm name = `maplace` (unscoped, free as of 2026-10-03) | done | claimed only at the gate (R2); if taken by then, 1.0 ships as `maplace-js` (user owns it); old `maplace-js` → deprecate (R6) if `maplace` was claimed |
| D5 | Maps loading | done | lib calls global `google.maps.importLibrary` (works with Google bootstrap and js-api-loader v2; no loader peer dep); never reads `google` at import. Only the element's Google provider (D18) may inject Google's bootstrap: attributes `api-key`, `version`, `language`, `region`, `nonce` (CSP); one shared tag per page however many elements (the one deliberate global, idempotent); never injects while the element is held idle (consent, W8); a second element with conflicting loader attributes (`api-key`, `version`, `language`, `region`) is misuse: error state + `error` event on that element (A3 element rule), never silently ignored. Plain ESM with no `google.maps.importLibrary` → load state `error` + `error`. Capabilities are static per adapter (Google always declares `route`); a loaded Maps version without `Route` → `error` when a route is requested (runtime failure, known only after async load) |
| D6 | Google markers = AdvancedMarkerElement only | done | mapId required (`DEMO_MAP_ID`, Google's public demo constant, for dev/tests) |
| D7 | Google styling = mapId + Cloud Console only | done | `styles` dropped (JSON styles ignored with mapId, docs-verified); `colorScheme` via `google` options |
| D8 | Google routing = Routes JS `Route.computeRoutes` | done | beta 2025-08-21 (3.62.1), weekly channel 2025-10-23 (3.62.11d), so safe floor is 3.63 (3.62.1 was beta-only); current quarterly 3.65 has it (versions page, 2026-10-03); `createPolylines` + stop markers; `directions_panel` dropped; route API per D22 |
| D9 | Tooling = esbuild + tsc, Biome, Vitest, GH Actions | done | esbuild bundles ESM + IIFE, tsc emits .d.ts; Biome lint+format; Vitest unit + browser mode (T2). TS 7 `.d.ts` emit checked 2026-10-11 (generics, overloads, private fields, unions: correct); re-check with attw in P1, TS 6 for emit only if it regresses |
| D10 | Site = Astro + MDX, static, on Cloudflare Workers static assets | done | maplacejs.com: GoDaddy (expires 2027-02-25), NS already Cloudflare → attach custom domain |
| D11 | `origin/develop` = mine, then delete | done | onPolylineClick + #154 trigger docs; `this.scope` refactor and FreezeZoom/UnFreezeZoom TODO stubs → drop; all recorded in A4; delete in R5 |
| D12 | Analytics = Cloudflare Web Analytics; consent = site-wide one-time for Google Maps | done | maps behind placeholder + 'Load Google Maps', remembered in localStorage, revocable from footer |
| D13 | Positioning | done | value = "a list of locations → map + synced list/menu in ~5 lines"; anything not serving that is cut. Short answer to "why not `<gmp-map>` / `@vis.gl/react-google-maps`?": they render maps, maplace turns a data list into map + synced list with selection; full answer in RFC §1 |
| D14 | Architecture = headless core + adapter + views | done | core: state only (locations, selection, viewport), no DOM, no provider; adapter renders state; views (list/menu) optional and replaceable |
| D15 | Locations keyed by `id` | done | `id` required, coordinates `lat`/`lng` (Google/MapLibre naming); no auto ids, no `lon` alias; `setLocations(next)` diffs by id; select/show/remove by id; no index-based API |
| D16 | One typed event system | done | `on(event, fn)` returning unsubscribe; includes `error`; no before/after callback pairs, no callback options |
| D17 | Bindings designed with the core | done | React + Web Component usage written in the RFC first; element ships in 1.0, React in 1.x |
| D18 | One package, subpath exports | done | `maplace` (core + adapter contract), `maplace/google`, `maplace/element` (defines `<maplace-map>` once + provider registry), `maplace/element/google` (registers the Google provider, defining the element if needed; `provider` attribute picks one, defaulting to the only registered; ambiguity is misuse), `maplace/react` (1.x), later `maplace/maplibre`; one version, one tag `v<version>`; react, markerclusterer, maplibre-gl as optional peers. CDN: two IIFEs of `element` + `element/google`, `maplace-element.iife.js` and `maplace-element-cluster.iife.js` (markerclusterer bundled; no runtime fetch from other origins) |
| D19 | 1.0 scope | done | core + Google adapter + element. Post-1.0: React (1.x), long lists (V2), playground, MapLibre adapter. Confirmed by A0: jsDelivr serves 0.2 ~839k times/yr vs ~1.9k npm installs |
| D20 | Content model | done | `title` (text): list label + marker accessible title. `content`: info window, string (rendered as text) \| Node \| `(loc) => Node`. `icon`: optional custom marker element, URL string \| Node \| `(loc) => Node` (0.2's field name; avoids `{type: 'marker', marker: …}`; A3 glossary confirms). `html`: opt-in, passed through a user-supplied `sanitize` hook (docs show DOMPurify); `html` without `sanitize` throws (misuse). Element supports `<template>` per location: trusted author markup, skips `sanitize`; `html` set through `locations` still needs the hook. 0.2 data needs conversion (A4, MIGRATION.md) |
| D21 | MapLibre-ready from day one (very likely after 1.0) | done | adding it = new adapter, no rewrite. No provider types outside the adapter (own `LatLng`, bounds, padding, payloads; content = DOM Node, which both accept). Neutral options on the store (view, fit padding); provider options on the adapter factory (`createGoogleAdapter({ mapOptions })`), as RFC §3 says. Adapter contract in core: mount, apply diff, viewport, fit, events, destroy, `mountControl(node, position)` with neutral positions (`top-left`, `top-right`, `bottom-left`, `bottom-right`, …), `capabilities`. Capabilities for what differs: route (Google only), clustering (markerclusterer vs MapLibre GeoJSON clustering), circle (native vs polygon), editable shapes (native vs plugin/none). Unsupported capability or location type is misuse. Check timing: before attach the headless store skips capability checks (other misuse, e.g. duplicate ids or bad args, still throws); `attach()` validates current state against capabilities and throws; after attach, store calls validate synchronously and throw; applying a diff never throws (runtime failures → `error`); in the element, misuse → error state + `error`. Load/consent states neutral |
| D22 | Route API | done | store state, neutral data: `route: { stops: [id, …], travelMode }`; stops are ordinary selectable locations (0.2 used locations as waypoints); adapters with the `route` capability draw it; the store emits a typed `route` event (legs, distance, duration); adapter without it → misuse (timing per D21). Edge rules: ≥ 2 stops; maximum from the adapter's `routeStopLimit` (Google Routes: 25 intermediates, so 27); `route` with unknown ids throws; removing a stop's location drops it from `stops` (route cleared below 2); recompute only when `stops`, their positions or `travelMode` change, and for drags only on drag end (Routes calls cost money); clearing the route emits `route` with `undefined` so views update; provider failure (no route) → `error`; `route` event payload uses core neutral types (D21) |

## 1. API RFC
| # | Item | Status | Note |
|---|------|--------|------|
| A0 | Triage old GitHub issues/PRs, read-only | done | `docs/rfc-1.0.md` Appendix A: 198 items in 27 themes, usage signals, new requirements, C7 candidates, R5 actions for the 42 open items |
| A1 | Positioning doc | done | RFC §1: one-liner, five-line promise, audience, principles, non-goals with reasons, comparison (`<gmp-map>`, vis.gl, `<gmpx-store-locator>` as closest neighbour, Places UI Kit, Leaflet/MapLibre), success criteria |
| A2 | Use cases as code first | done | RFC §2; `packages/maplace/examples/<scenario>/{page.html,vanilla.ts,react.tsx}` for simple, markers, circles, menu, tabs, polyline, polygon, route, mixed, big; TS/React type-check in `npm run typecheck`, HTML runs in T5/T6 |
| A3 | Public API as types | done | RFC §3: glossary, shape, rules, errors and check timing, decisions on the A0 notes, size budgets and coverage numbers. Types in `packages/maplace/src/` (`declare` only), compile-time tests in `src/__typetests__/`; React draft in `src/react/`, not exported |
| A4 | 0.2 → 1.0 inventory | done | RFC §4: every option, location field, method and event of 0.2 (source, README, old docs site, `develop`) mapped to 1.0, plus behaviour changes; `examples/migrate/from-0.2.ts` converts locations (type-checked). Gaps it found, decided by the user and added to A3: shape `style`, typed `data` (`createMaplace<Data>`), `select(id, { zoom })`, `fitAllLabel`, initial `selectedId`; optional inputs accept explicit `undefined`. Review chain moved resolution into the store: adapters get `Drawable`s (geometry, merged style, content/icon builders, no `data` or sanitizer) and report `Geometry` back; one `editable`, `invalid-input`, a `location` view instead of `reveal` |
| A5 | Review and freeze RFC | done | frozen 2026-10-12: consistent with the types (audit), self-contained (no plan IDs; loading, packaging, Routes and MapLibre-readiness decisions added to §3), sections numbered §1–§4; changes after freeze edit the RFC with the types |
| A6 | MapLibre spike (before A5) | done | contract held for markers, polyline, select, popup, fit, viewport, controls. Leaks fixed in A3 types/RFC: zoom convention (measured), antimeridian (store resolves fit-all to bounds), store deselects on the selected popup closing, `data-*` while true and DOM-only, default markers may be non-DOM, `apply` resolves once drawn |
| A7 | "big" performance spike (before A5) | done | RFC §3 Performance. D6 stands; `cluster` above ~1k |

## 2. Foundation
| # | Item | Status | Note |
|---|------|--------|------|
| F0 | (moved to R2) | done | npm name claimed at the gate |
| F1 | (moved to R1) | done | |
| F1b | (moved to R5) | done | |
| F1c | (moved to R3) | done | |
| F1d | "1.0 rewrite in progress" notice on README | wont | nothing public until the gate (user) |
| F1e | (moved to A0) | done | |
| F2 | Remove Grunt, Bower, Travis, jscs, jshint, `src/`, `website/` | done | 0.2 recoverable from tag `0.2.10` (`git show 0.2.10:src/maplace.js`) and the `website` branch; README stays until P6 |
| F3 | npm workspaces, `.nvmrc`, `devEngines`, `.editorconfig` | done | see `package.json`, `packages/maplace/package.json`. `private: true` until R2, so npm refuses to publish. `exports` already name the `dist` paths, plus a package-scoped `maplace:source` condition → `src` for development: every tool that resolves `maplace` from source must set it (tsconfig `customConditions` done; Vitest/Vite `resolve.conditions` in T1, esbuild `conditions` in P1, Astro via Vite in W1). `apps/*` workspace glob arrives with W1 |
| F4 | tsconfig strict + Biome | done | see `tsconfig.json`, `biome.json`, `.editorconfig`. TS 7 defaults cover strict, Bundler resolution and `types: []`, so the config only adds what the defaults don't; Biome takes formatting from `.editorconfig` and ignores from `.gitignore`. Scripts: `npm run typecheck`, `npm run check`, `npm run fix`. File-size guideline goes in CLAUDE.md (F6) |
| F5 | CI: lint, typecheck, unit, fake-adapter tests, build, publint, attw, size budget, import boundaries (T10) | done | `.github/workflows/ci.yml` runs the gates in `CLAUDE.md` Commands on every push (fork PRs too); Actions pinned by SHA. Gates that need code arrive with their row, which adds its CI step: T1/T2/T5 tests, P1 build, T4 publint + attw + consumer fixture, P3 size-limit, T2 real-Maps job |
| F6 | Grow `CLAUDE.md` | do | minimal one exists (agent workflow + pointer here); once the new layout exists add commands, layout, file-size guideline, and move this file's header into it; the header then shrinks to a pointer |
| F7 | Renew maplacejs.com | do | expires 2027-02-25 (GoDaddy); consider transferring to Cloudflare Registrar |
| F8 | Dependabot for Action SHAs and npm | do | GitHub reads its config only from the default branch: lands with R3 |

## 3. Core (headless)
| # | Item | Status | Note |
|---|------|--------|------|
| C1 | Store | do | locations, selection, viewport intent; `subscribe`/`getSnapshot` (works with `useSyncExternalStore`); immutable snapshots |
| C2 | Id-keyed locations + diffing | do | `setLocations(next)` yields added/updated/removed; adapters apply only the diff |
| C3 | Location types | do | marker, circle, polyline, polygon as a discriminated union (`path` for lines and polygon outer ring, `holes?`); fields per D20; `group` + `setFilter`; route is store state (D22), not a location type |
| C4 | Typed events | do | select, hover, drag, edit, route, error; unsubscribe fn; AbortSignal support |
| C5 | Lifecycle | do | `destroy()`, AbortSignal, many instances, nothing global, SSR-safe import |
| C6 | Tree-shakable | do | each subpath and location type independently importable; `sideEffects` is an array listing the element entries (they define a custom element on import; `false` would let bundlers drop `import 'maplace/element/google'`), everything else side-effect-free |
| C7 | 0.2 bug scenarios as tests | do | anchored to tag `0.2.10` (permalinks): shared controls (L257), maxZIndex (L349; 1.0: selected marker stacks on top), edit callbacks (L529), control removal (L866), AddControl (L937), onPolylineClick, route with draggable stops (#147, #139), plus the A0 candidates in `docs/rfc-1.0.md` Appendix A; each becomes a regression test the design makes impossible |
| C8 | Input validation | do | lat/lng numeric and in range, required fields, container found, icon type; per the A3 error policy, naming location id and field; never a silent grey map (A0: #63, #125, #145, #149, #175) |

## 4. Google adapter (first implementation of the contract, `maplace/google`)
| # | Item | Status | Note |
|---|------|--------|------|
| G1 | Attach to a map | do | `importLibrary` for maps/marker/routes on demand; accepts an existing `google.maps.Map` or creates one from `google: {…}` options |
| G2 | Markers | do | AdvancedMarkerElement; content per D20; `gmpClickable`, keyboard focus, titles |
| G3 | Shapes | do | circle, polyline, polygon; drags and edits write geometry back to the store, then `change` fires (RFC §3) |
| G4 | Popup | do | neutral term "popup" (Google InfoWindow); content per D20; `popup: { maxWidth, offset, openOn }`; `popupOpen` after content is in the DOM; XSS-safe by default |
| G5 | Fit all / pan / zoom | do | from store viewport intent; adapters get fit-all already resolved to bounds (A6) |
| G6 | Route capability | do | D8 + D22 |
| G7 | Clustering capability | do | ESM: lazy-imports `@googlemaps/markerclusterer` (optional peer); CDN: bundled in the cluster IIFE (D18); "big" is the benchmark; measure chunked adding (RFC Performance) |
| G8 | On-map controls | do | adapter implements `mountControl(node, position)` (maps neutral positions to `ControlPosition`); views never touch the map (T10) |
| G9 | Load + error states | do | missing/invalid key or mapId, quota, library load failure → `error` event + state |
| G10 | Container resize/visibility | do | ResizeObserver on the container; re-apply viewport intent when a hidden or resized map becomes visible (A0: #1, #79, #83, #136, #154, #173) |

## 5. Views and bindings (parallel to 4)
| # | Item | Status | Note |
|---|------|--------|------|
| V1 | List + select views (vanilla) | do | `createListView(maplace, { as, groupHeadings, render })`; accessible (listbox/aria-selected, keyboard, native `<select>`); group headings; synced to store selection and hover |
| V2 | Long lists | later | virtualise or paginate (D19) |
| V3 | `<maplace-map>` Web Component | do | attributes + `locations` property + child `<maplace-location>` + `<template>` content; loading attributes per D5; DOM events; works in React 19 as-is; `provider` attribute (D18); `<maplace-location location-id="…">` (not HTML `id`, which must be unique per document); a second maplace copy on one page fails loudly at import with an error naming both (intended for every case: IIFE + ESM, both CDN IIFEs, two npm versions via a pinned dependency); detected via `customElements.get('maplace-map')` returning a constructor from another copy, no global flag; never silently keeps the first (separate copies can't share a provider registry; no second global); CDN IIFEs per D18 |
| V4 | React: provider + components | later | 1.x: `<Maplace locations>` with `<Map/>`, `<LocationList/>`, `<Marker>` children; hooks via `useSyncExternalStore` |
| V5 | React content in markers/info windows | later | 1.x: portals into marker content; JSX, no HTML strings |
| V6 | React SSR + RSC | later | 1.x: no window at import; `"use client"` where state lives |
| V7 | Load states | do | idle / loading / ready / error exposed to views and sites; an element can be held idle (no Maps injection) until released, which W8 uses for consent |

## 6. Tests (alongside 3–5)
| # | Item | Status | Note |
|---|------|--------|------|
| T1 | Core unit tests | do | pure logic, no DOM, no provider mocks; Vitest is installed (F5, root `vitest.config.ts` runs `scripts/` tests): add the package project with `resolve.conditions` incl. `maplace:source` |
| T2 | Adapter + views in Vitest browser mode | do | fake adapter (in-memory implementation of the adapter contract that records calls; no DOM map, no provider) = required PR gate; real Maps on push to `next` until R3, nightly after it (schedules only run from the default branch; fork PRs get no secrets): API key as secret, referrer-restricted and quota-capped; `DEMO_MAP_ID`; Maps JS pinned (`v=quarterly` or a numbered version) |
| T3 | Type tests | do | `expectTypeOf` on public API (A3) |
| T4 | Package checks | do | publint + attw in CI; plus a strict consumer fixture type-checking the built `dist` `.d.ts` without `skipLibCheck` (the repo needs it only for `@types/google.maps` vs `exactOptionalPropertyTypes`) |
| T5 | Docs examples executed | do | fake adapter on PRs; real Maps on push to `next` until R3, nightly after; docs can't drift |
| T6 | E2E on site examples | do | Playwright, consent flow included; on push to `next` until R3, nightly after |
| T7 | A fix lands with a test shown failing first | do | convention |
| T8 | Coverage gate | do | threshold from RFC (A3) |
| T9 | Adapter conformance suite | do | one shared contract test set run against fake, Google, later MapLibre adapters; fake adapter keeps the contract honest from day one. Waits on `apply`; checks a known zoom gives a known bounds span and a fit across ±180° gives west > east |
| T10 | Import boundaries check | done | `scripts/checks/imports.ts` (the `LAYERS` table) plus Biome `noRestrictedGlobals` for `google.maps` outside `src/google/`. A MapLibre adapter adds its own layer and fence |
| T11 | RFC ↔ types check | done | `scripts/checks/rfc.ts` compares the RFC with `src/__typetests__/api-lists.ts`, whose `.test-d.ts` ties each list to its type |

## 7. Package and release
| # | Item | Status | Note |
|---|------|--------|------|
| P1 | Builds | do | per-subpath ESM + .d.ts (TS 7 emit, see D9) into the `dist` paths `exports` already names; `./react` stays a source-only (`maplace:source`) export until 1.x and is stripped from the packed manifest (publint/attw would flag it); `@types/google.maps` as optional peer (the Google `.d.ts` references it); add `sideEffects` listing the element `dist` entries (C6); split tsconfig per package only if emit needs it; two IIFEs per D18, each with its own size budget; `exports` map without `react` until 1.x, `files` |
| P2 | Release workflow | do | manual dispatch with version; refuse not-above-last (compares only tags ≥ `v1.0.0`; legacy `v0.1.x`/`0.2.x` tags ignored); pre-release only to dist-tag `next`; tag `v<version>`; publish via npm trusted publishing (OIDC, set up in R2) with provenance; built during the private phase, first used after R3 |
| P3 | Size budget per subpath | do | size-limit in CI; numbers from RFC (A3) |
| P4 | CHANGELOG.md convention | do | one dated line per reader-visible change, same commit, `#N` for closed issue; test refuses a closing commit not listed, checking only commits after the one that creates CHANGELOG.md (baseline); "closes" = GitHub closing keyword (`close[sd]?`, `fix(es\|ed)?`, `resolve[sd]?` + `#N`); seed with 0.x history |
| P5 | Release notes from CHANGELOG lines since last tag | do | GitHub release body from P2 |
| P6 | README rewrite | do | leads with the CDN `<maplace-map>` 5-liner; then vanilla; CDN via jsDelivr/unpkg, version-pinned URLs with SRI hashes; load exactly one IIFE (plain or cluster) per page (V3) |
| P7 | MIGRATION.md 0.2 → 1.0 | do | from RFC §4 + `examples/migrate/` |
| P8 | Public 1.0.0-beta | wont | beta is private: test page installs `github:danielemoraschi/maplace.js#next` or an `npm pack` tarball (R0) |
| P9 | (moved to R2) | done | |

## 8. Website
| # | Item | Status | Note |
|---|------|--------|------|
| W1 | apps/site (Astro + MDX) | do | docs from the RFC, not from old partials |
| W2 | Examples | do | 0.2 sample data from `git show 0.2.10:website/data/points.js` (and `4k.js`); HTML + vanilla per A2 scenario for 1.0; React examples in 1.x; route replaces directions, styled becomes cloud-styled mapId |
| W3 | Fusion example | wont | API dead |
| W4 | `ajax.php` → static JSON | do | |
| W5 | (moved to N4, playground) | done | |
| W6 | Referrer-restricted demo key + mapId | do | quota-capped, like T2's |
| W7 | Cloudflare Web Analytics | do | D12 |
| W8 | Maps consent gate | do | D12; built on V7 |
| W9 | Privacy page | do | covers CF analytics + Google Maps |
| W10 | Deploy from CI | do | wrangler-action: `next` and feature branches → preview alias (noindex) now; production + custom domain in R4 |
| W10b | `/changelog` from CHANGELOG.md | do | at build time |
| W10c | Offsite check | do | allowlist: cloudflareinsights before consent, Google Maps only after; after each deploy now, daily cron once on `main` (R3/R4) |
| W11 | (moved to R5) | done | |

## 9. Go public (only at the gate, in this order)
| # | Item | Status | Note |
|---|------|--------|------|
| R0 | Gate: "stable" | do | all 1.0 rows done; every CI gate green; last 10 real-Maps runs on `next` green; private beta used in a real page; site complete on preview; README + MIGRATION done; RFC §1 success criteria met; user says go |
| R1 | `legacy/0.2` from tag `0.2.10`, pushed | do | not from master: release commit d51ada2 isn't on master (its later README commit 28b39bd is left out, fine) |
| R2 | Settle npm name, publish 1.0.0 | do | first publish is manual (OIDC can't do a first publish); claims `maplace`; if taken, rename package + docs to `maplace-js` on `next` first; then enable npm trusted publishing for P2 |
| R3 | `master` → `main`, fast-forward to `next`, tag `v1.0.0` | do | rename on GitHub (redirects); `next` grew from master's head 28b39bd so it's a fast-forward; schedules and P2 start working; `Fixes #N` commits now close their issues |
| R4 | Production deploy + maplacejs.com | do | custom domain on Cloudflare; offsite cron active |
| R5 | Public repo cleanup | do | act on the open-item list in `docs/rfc-1.0.md` Appendix A (some already closed by R3); prune `0.1.2`, `0.1.3`, `0.2.0`, `0.2-stable`, `develop` (tags stay); delete `website` branch |
| R6 | `npm deprecate maplace-js` → "moved to maplace" | do | only if R2 claimed `maplace` |

## Post-1.0
| # | Item | Status | Note |
|---|------|--------|------|
| N1 | React binding release (V4–V6) | later | 1.x |
| N2 | Long lists (V2) | later | virtualise or paginate; "big" benchmark |
| N3 | `maplace/maplibre` adapter | later | very likely; ready per D21, contract proven by A6 + T9. Spike lessons: serve maplibre-gl unbundled or set its worker URL; zoom − 1; default markers in a GPU circle/symbol layer, DOM only for custom icons; GeoJSON cluster source for `cluster`; circle = polygon approximation |
| N4 | Live playground | later | editable examples (StackBlitz or in-page) |
| N5 | (moved to R6) | done | |
| N6 | TypeDoc API reference | later | the RFC + examples matter more |
| N7 | Geocoded address locations | later | adapter capability |
| N8 | 0.2 options compat shim | wont | MIGRATION.md is enough |
| N9 | Vue/Svelte wrappers | wont | Web Component covers them |
| N10 | GeoJSON FeatureCollection → locations helper | later | A0: #103, #188 |
| N11 | "My location" control / route from user position | later | A0: #169 |
| N12 | Places integration | later | search box / autocomplete that adds locations, place details as `content`, "save a place"; adapter capability (Google Places now; MapLibre would need another geocoder); A0: #41, #98, #152, #165 |
| N13 | Route modifiers | later | avoid tolls, highways, ferries (0.2 `directions_options`); A4 |
