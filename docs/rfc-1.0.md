# maplace 1.0 RFC

Work in progress. This document is self-contained: every decision states its own reason.

- A1 Positioning, A2 Use cases, A3 API: written (A3 is a draft until the RFC is frozen)
- A4 0.2 → 1.0 inventory: to come
- Appendix A: 0.2 issue triage

## A1. Positioning

A list of your locations becomes a map with a synced list, in about five lines. Google Maps today, MapLibre next.

### The five-line promise

Attribute names as drafted in A3.

```html
<script src="https://cdn.jsdelivr.net/npm/maplace@1/dist/maplace-element.iife.js"></script>
<maplace-map api-key="YOUR_KEY" map-id="DEMO_MAP_ID" list>
  <maplace-location location-id="rome" lat="41.9028" lng="12.4964" title="Rome"></maplace-location>
  <maplace-location location-id="milan" lat="45.4642" lng="9.19" title="Milan"></maplace-location>
</maplace-map>
```

A map with two markers, a list beside it, and selection kept in sync: click a marker and the list highlights it; pick it in the list and the map pans and opens it.

### Who it is for

1. **Pages with a list of places**: offices, venues, events, trips, stores, built with a `<script>` tag on a CMS or static site. This is the audience 0.2 still serves: about 839k jsDelivr hits a year against about 1.9k npm installs (Appendix A).
2. **Developers in any framework** who want a small headless store (locations keyed by id, selection, viewport) and a map adapter, without adopting a map toolkit.
3. **React users**, through a binding in 1.x. Until then `<maplace-map>` works in React 19 as a custom element.

### What it does

- Takes your data as HTML children, JSON or JS objects, each location with a stable `id`.
- Shows it as a map plus a list or menu, with selection, hover and viewport kept in sync both ways.
- Location types: markers, circles, polylines, polygons; one route through your own locations.
- Clustering for large lists.
- Accessible list controls (keyboard, ARIA, native `<select>`).
- Typed events for selection, edits, routes and errors.
- Consent-friendly loading: the map stays idle, with no request to the map provider, until the page releases it.
- Many maps per page, no globals, no framework required.

### Principles

- **Your data, not a provider's.** maplace renders the locations you own; provider services are optional extras.
- **Provider behind an adapter.** No provider types leak into the core or the public API, so MapLibre is a new adapter, not a rewrite.
- **Nothing global.** Every map is independent; the only shared thing is the provider's own script.
- **Safe by default.** Strings render as text; HTML needs an explicit sanitizer.
- **Accessible.** The list is the accessible way into the map, not an afterthought.
- **Small.** Each feature (route, clustering, element) is its own import; you pay only for what you use.
- **Loud errors.** Bad input or a missing key reports what is wrong and where, never a silent grey map.

### Non-goals for 1.0

| Not this | Why |
|---|---|
| A GIS or layer toolkit (KML, traffic, heatmaps, data layers) | Add them to the underlying map object, which maplace exposes; they don't serve "list of places ↔ map". |
| Drawing tools | An editor is a different product; shapes can be draggable and editable, not drawn from scratch. |
| Geocoding addresses | Needs a provider service and quotas; locations come with coordinates in 1.0. |
| A store-locator product (distance matrix, opening hours, booking) | Store locators are one use case; those features are app logic or a dedicated component (see below). |
| Route alternatives or several routes per map | One route through your own locations covers the 0.2 use; more turns maplace into a routing UI. |
| Other provider services (places search, distance, elevation) | Not in 1.0; Places integration is a likely later addition. |
| A React map toolkit | Excellent ones exist (see below); maplace's job is the data list and selection, in any framework. |
| Legacy browsers | Evergreen browsers only (ES2020). |
| 0.2 API compatibility | The 0.2 API was index-based and jQuery-shaped; MIGRATION.md shows a short data conversion instead. |

### How it compares

| | What it is | Framework | Provider | Your data as list + map, selection synced | Pick it when |
|---|---|---|---|---|---|
| **maplace** | Data list → map + list, headless core + adapters | None (element, JS); React later | Google; MapLibre next | Yes, the core job | You have a list of places and want map and list in sync with little code |
| `<gmp-map>` / `<gmp-advanced-marker>` | Google's HTML map and marker elements | None | Google | No: map and markers only, no list, selection or update diffing | You only need a map with a few fixed markers |
| `@vis.gl/react-google-maps` | React components for the Maps JS API (map, markers, shapes, 3D) | React | Google | No: building blocks, you write list and selection | You're in React and want full control of a Google map |
| `<gmpx-store-locator>` (Extended Component Library) | Ready-made store locator for your listings | None (element), React wrapper | Google | Partly: list + map of your listings, fixed store-locator UX, markers only | You want a classic "find the nearest store" page with Google place details |
| Places UI Kit (`gmp-place-search`, `gmp-place-details`) | Google's place search and details elements | None | Google | No: shows Google's place data, not yours | You want Google's place information; complementary to maplace |
| Leaflet / MapLibre directly | Map rendering libraries | None | Any tiles | No: map only | You need a custom map and will build everything around it |

### Why a 1.0

- 0.2 depends on APIs Google removed or deprecated: Fusion Tables (shut down), the old `Marker` and `MarkerImage`, and the legacy Directions service.
- It needs jQuery and was built with tooling that no longer runs.
- It is still loaded hundreds of thousands of times a year from CDNs, so a working, safe successor is worth having.

### Later, not 1.0

React binding; MapLibre adapter; Places integration (search box that adds locations, place details as content); GeoJSON import; long-list rendering.

### How we'll know it worked

- The five-line snippet runs from a blank HTML file with only an API key.
- A typical 0.2 page migrates by following MIGRATION.md in under 30 minutes.
- None of the "pick it when" cases above is something maplace does half-way.

## A2. Use cases

Ten scenarios, each written three ways against the A3 draft: an HTML page using `<maplace-map>`, vanilla TypeScript, and React (1.x draft). They live in [`packages/maplace/examples/`](../packages/maplace/examples/); the TypeScript and React versions type-check against the API in CI, and the HTML versions will run in the end-to-end tests. Together they mirror the 0.2 demo site, so every 0.2 user can find their case.

| Scenario | Shows | 0.2 equivalent | 0.2 issues it answers |
|---|---|---|---|
| [simple](../packages/maplace/examples/simple/) | One marker, nothing else | simple | #52, #55, #65 (single location) |
| [markers](../packages/maplace/examples/markers/) | Markers, popup content from a `<template>` or string, custom icon, list | markers | #37, #60, #101, #192 (icons) |
| [circles](../packages/maplace/examples/circles/) | Circles with radius in metres | circles | #13, #130 |
| [menu](../packages/maplace/examples/menu/) | Native `<select>` on the map, groups, filter | menu (dropdown) | #15, #40, #117 (groups) |
| [tabs](../packages/maplace/examples/tabs/) | List outside the map, details panel driven by the `select` event | tabs | #5, #84, #122 |
| [polyline](../packages/maplace/examples/polyline/) | One polyline location, inline JSON data | polyline | #178 |
| [polygon](../packages/maplace/examples/polygon/) | Editable polygon, edits written back, `change` event | polygon | #64, #164 |
| [route](../packages/maplace/examples/route/) | One route through ordered stops, distance from the `route` event | directions | #121, #147 |
| [mixed](../packages/maplace/examples/mixed/) | Markers and circles together, data fetched by the page | mixed (ajax) | #43, #134, #179, #193 |
| [big](../packages/maplace/examples/big/) | 4,000 points with clustering | big | #3, #54, #174, #182 |

What the scenarios settled:

- **Data in the element** comes from `<maplace-location>` children, an inline `<script type="application/json">` child, or the `locations` property. The element never fetches; pages load data with `fetch` and assign it.
- **Shapes are single locations.** In 0.2 a polyline or polygon turned every location into a vertex and listed the vertices. In 1.0 a polyline is one location with a `path`; mark points of interest along it as separate markers if they belong in the list.
- **The list is the element's own view.** `list` puts a list beside the map, `list="select"` a native select, and `list-position` places it on or outside the map.

## A3. API (draft)

The types are in [`packages/maplace/src/`](../packages/maplace/src/) as declarations, with compile-time tests in `src/__typetests__/`. This section explains them; the files are the reference.

### Glossary

| Term | Meaning |
|---|---|
| location | One item of your data: a marker, circle, polyline or polygon, with a unique `id` |
| selection | The one location currently chosen (`selectedId`), shared by map and list |
| hover | The location under the pointer or keyboard focus (`hoveredId`) |
| view | What you asked the map to show: fit all, or a centre and zoom (selecting a location pans to it) |
| viewport | What the map actually shows, as reported by the provider |
| popup | The bubble that opens on a location (Google's InfoWindow, MapLibre's Popup) |
| route | One path through your own locations, in order |
| filter | The groups currently shown |
| adapter | The bridge to a map provider (Google now, MapLibre next) |
| list view | The UI that renders locations as a list or select and asks the store for changes |
| capability | A feature an adapter may or may not support: route, cluster, circle, edit |

### Shape

- **Core (`maplace`)**: `createMaplace(options?)` returns a headless store: `subscribe`/`getSnapshot` (works with React's `useSyncExternalStore`), `setLocations`, `select`, `setFilter`, `fitAll`, `setView`, `setRoute`, `on`, `attach` (returns `detach`), `ready`, `destroy`. The snapshot is immutable and replaced on every change; unchanged parts keep their reference, and a location counts as updated when its object changes.
- **Locations** are a union on `type`: markers (the default) take `lat`/`lng`, circles `center` + `radius` in metres, polylines `path`, polygons `path` + optional `holes`. All take `id`, `title`, `content`, `html`, `group`, `visible`.
- **Content** is a string (always rendered as text), a DOM node, or a function returning one. `html` is accepted only with a `sanitize` option.
- **Events**: `select`, `hover`, `change` (after a drag or edit, already written back to the store), `popupOpen` (content is in the DOM), `popupClose`, `viewport` (after a move ends), `route` (`undefined` when cleared), `error`. `on()` returns an unsubscribe function and accepts an `AbortSignal`.
- **Adapter contract**: `mount`, `apply` (a diff of added, updated and removed locations), `present` (selection, hover, hidden ids, cluster, popup options), `setView`, `setRoute`, `mountControl`, `destroy`, a set of `capabilities` and an optional `routeStopLimit`. Provider limits live in the adapter, not the core. Adapters report back only through an `AdapterHost`; they never read or write the store.
- **Google (`maplace/google`)**: `createGoogleAdapter({ mapId, colorScheme?, map?, mapOptions? })`. The only entry that knows `google.maps`. Maps JS must be loaded (Google's bootstrap or js-api-loader); the adapter calls `google.maps.importLibrary`.
- **Views**: `createListView(maplace, { as, groupHeadings, render })` returns a `ListView`: `{ element, destroy }`.
- **Element (`maplace/element`, `maplace/element/google`)**: `<maplace-map>` and `<maplace-location>`; attributes, properties and `maplace-*` DOM events are listed in [`src/element/`](../packages/maplace/src/element/). `<maplace-location>` takes `location-id` (not `id`, which must be unique per page) and an optional trusted `<template>` child.
- **React (1.x draft)**: `<MaplaceProvider locations>` with `on<Event>` props derived from the event map and optional controlled `selectedId`, `filter`, `route`; `<MaplaceMap adapter>` (attaches on mount, detaches on unmount); `<LocationList>`; `useMaplace()`.

### Rules the API follows

- Verbs for methods, nouns for types, one word per concept (see the glossary); no aliases and no two ways to do the same thing.
- At most two positional arguments, then an options object; never a boolean flag (`select(id, { pan: false })`, not `select(id, false)`).
- Absence is `undefined`, never `null`.
- Each function does one thing: `attach` connects (and throws on misuse), its returned `detach` disconnects, `ready` waits for loading.
- Views know only the store, adapters know only their host, and only the element (or your code) wires them together.

### Errors

- **Misuse throws** a `MaplaceError` from the call that caused it, with a `code`, the `locationId` and the `field`: duplicate or missing ids, `lon` instead of `lng`, a circle without a radius, `html` without `sanitize`, unknown stop ids, a feature the adapter lacks.
- **Runtime failures are events**, never throws: provider load or auth failure, route not found. `loadState` becomes `error` and `ready()` rejects.
- **When capabilities are checked**: before `attach` the store skips capability checks (other misuse still throws); `attach` checks the current state against the adapter and throws; afterwards each call checks before changing anything. Applying changes to the map never throws.
- **In the element**, where no caller can catch a throw, misuse sets the error state and dispatches `maplace-error`. Nothing fails silently.

### Decisions from the 0.2 issues

| Need (issues) | Decision |
|---|---|
| Categories and filters (#15, #36, #40, #44, #85, #87, #117, #143) | `group` on a location, `setFilter(groups)` on the store; the list shows group headings |
| Saving dragged or edited shapes (#48, #49, #64, #107, #155, #164, #178) | The store writes the new geometry back and fires `change`; pages save from the event |
| Map container sizing and styles (#23, #184) | The element never sets inline styles on itself; default styles use `:where()` so pages override them; the page sets the height |
| Popup width and offset (#86, #160, #198) | `popup: { maxWidth, offset }` |
| Open on hover (#197) | `popup: { openOn: 'hover' }`; default `click` |
| Different icon when selected (#192) | Markers carry `data-selected` / `data-hovered` for CSS; an `icon` function receives `{ selected, hovered }` and re-runs only when they change |
| Act on popup content once shown (#171) | `popupOpen` fires after the content is in the DOM, with the element |
| React to zoom and pan (#195) | `viewport` event after each move ends |
| Hidden or resized containers (#1, #79, #83, #136, #154, #173) | The adapter watches the container's size and re-applies the view when it becomes visible |
| Silent grey map on bad input (#63, #125, #145, #149, #175) | Validation per the error rules above |

### Numbers

Checked in CI from the first build:

| | Budget (gzip) |
|---|---|
| Core (`maplace`) | ≤ 4 kB |
| Google adapter (`maplace/google`) | ≤ 8 kB |
| Element CDN build (core + Google + list view + element) | ≤ 15 kB |
| Element CDN build with clustering | ≤ 25 kB |

Test coverage: core ≥ 95% of lines, whole package ≥ 85%.

## Appendix A: 0.2 issue triage

Source: all 178 issues and 20 PRs of the 0.2 repo (2013–2022), read on 2026-10-10. Issue numbers only.

### Usage signals (2026-10-10)

| Signal | Value |
|---|---|
| GitHub stars / forks / watchers | 992 / 186 / 66 |
| npm `maplace-js` downloads, last year / last week | 1,924 / 32 |
| jsDelivr hits for npm `maplace-js`, last year | 838,621 |
| Open issues + PRs | 39 + 3 |

CDN traffic is about 400× npm installs: 0.2 is still served to pages via `<script>`, which supports the CDN/HTML-first 1.0 (D19).

### Themes

Demand = items + reactions + comments.

| Theme | Items | Demand | 1.0 answer |
|---|---|---|---|
| Dynamic location updates (add/remove/set/move) | 9, 56, 72, 94, 114, 138, 149, 153, 161, 168 | 44 (10+0+34) | covered by C1, C2 |
| Viewport intent: center, zoom, fit, pan | 16, 18, 27, 33, 46, 57, 88, 96, 109, 156, 172, 187, 191 | 37 (13+0+24) | covered by G5, C1 |
| Info window behaviour and options | 11, 19, 20, 25, 59, 67, 86, 133, 160, 171, 197, 198 | 35 (12+0+23) | covered by G4, D20 |
| Marker icons, size, labels, CSS, z-order | 37, 60, 69, 73, 74, 77, 91, 99, 101, 105, 106, 148, 150, 163, 192 | 31 (15+0+16) | covered by D6, G2, D20 |
| Route options and rendering | 6, 31, 51, 70, 92, 120, 135, 144, 169, 177 | 30 (10+0+20) | covered by D22, D8, G6 |
| Maps API loading, key, language | 21, 22, 45, 66, 100, 102, 128, 132, 183 | 28 (9+0+19) | covered by D5, V7, G9 |
| Native map options and escape hatch | 2, 4, 7, 29, 58, 62, 97, 166 | 27 (8+0+19) | covered by G1, D7 |
| Hidden or resized container rendering | 1, 79, 83, 136, 154, 173 | 26 (6+0+20) | new requirement → G10 |
| Groups, categories, filters, layer toggles | 15, 36, 40, 44, 85, 87, 117, 143 | 26 (8+0+18) | new requirement: group/tag on a location plus a visibility filter in the store, honoured by list view and map |
| Packaging, distribution, jQuery dependency | 26, 30, 50, 71, 82, 104, 112, 113, 116, 118, 119, 162, 185 | 23 (13+0+10) | covered by D2, D18, P1, P2, R2 |
| Places and location search (search box, place details, save a place) | 41, 98, 152, 165 | 12 (4+0+8) | post-1.0: Places integration (N12) |
| Other Google services (print, drawing, point-in-circle, distance matrix, off-road paths) | 93, 146, 151, 159, 180 | 10 (5+0+5) | out of scope: app logic or other Google APIs, beyond a location/route manager |
| Route result data, events, waypoint limits | 121, 129, 139, 142, 147, 176 | 19 (6+0+13) | covered by D22, C4, D8 |
| Events and callbacks API | 32, 53, 80, 110, 111, 127, 137, 141, 194, 195 | 19 (10+0+9) | covered by C4, D16 |
| Docs, website, examples | 17, 34, 134, 140, 157, 181, 189, 196 | 18 (8+2+8) | covered by W1, W2, W4, P6, F7 |
| Overlay layers (KML, traffic, bicycling, Data/GeoJSON) | 28, 38, 61, 68, 81, 103, 188 | 16 (7+0+9) | out of scope: native layers go on the user's own map object (G1) |
| Single location renders blank map | 52, 55, 65 | 15 (3+0+12) | covered by G5, C7 |
| List view and programmatic select | 5, 75, 84, 115, 122 | 14 (5+0+9) | covered by V1, D20 |
| Mixed location types on one map | 10, 43, 90, 158, 179, 193 | 13 (6+0+7) | covered by C3 |
| Geocoding and address input | 8, 24, 126, 131, 170 | 13 (5+0+8) | out of scope: geocoding is post-1.0 (N7) |
| Setup errors and input validation | 63, 125, 145, 175 | 13 (4+0+9) | new requirement → C8 |
| Editable/draggable geometry sync | 48, 49, 64, 107, 155, 164, 178 | 11 (7+0+4) | new requirement: drag/edit of markers and shapes writes geometry back to the store and emits a typed change event |
| Circles and shape styling | 13, 76, 130 | 11 (3+0+8) | covered by C3, G3 |
| Host element CSS and sizing | 23, 184 | 9 (2+0+7) | new requirement: never mutate host element styles; document required size |
| Multiple maps and instance access | 89, 123, 124, 186 | 9 (4+1+4) | covered by C5, V3 |
| Clustering and dense markers | 3, 54, 190 | 8 (3+0+5) | covered by G7 |
| Large datasets | 95, 174, 182 | 7 (3+0+4) | covered by A7, G7 |
| Multiple routes on one map | 78 | 3 (1+0+2) | out of scope: D22 fixes a single route per map |

### Noise

12, 14, 35, 39, 42, 47, 108, 167
### New requirements

| Requirement | Items | Placement |
|---|---|---|
| Observe container size/visibility (ResizeObserver) and re-apply the viewport intent when a hidden or resized map becomes visible | 1, 79, 83, 136, 154, 173 | 1.0 row G10 |
| Validate config and locations (numeric lat/lng, element found, icon) per the A3 error policy, naming location id and field; never a silent grey map | 63, 125, 145, 149, 175 | 1.0 row C8 |
| Location `group`/tags plus a visibility filter in the store; list view can render group headings | 15, 36, 40, 44, 85, 87, 117, 143 | A3 note |
| Draggable/editable markers and shapes write geometry back to the store and emit a typed change event (decide if editing is in 1.0) | 48, 49, 64, 107, 155, 164, 178 | A3 note |
| Never write inline styles on the host element; document the required size | 23, 184 | A3 note |
| Info window options: max width, pixel offset | 86, 160, 198 | A3 note |
| Info window open trigger click or hover (or a hover event plus `open(id)` recipe) | 197 | A3 note |
| Selected state available to marker content, so the selected icon can differ | 192 | A3 note |
| Info window open event fires after its content is in the DOM | 171 | A3 note |
| Viewport-changed event (zoom/center) | 195 | A3 note |
| GeoJSON FeatureCollection to locations helper | 103, 188 | post-1.0 |
| "My location" control / route from user position | 169 | post-1.0 |
| Several routes on one map, route alternatives | 78, 177 | rejected: D22 fixes a single route |
| Built-in traffic/bicycling/KML layers | 38, 61, 68, 81 | rejected: add to the user's own map (G1) |
| Places: search box / autocomplete feeding locations, place details as content, save a place | 41, 98, 152, 165 | post-1.0 (N12) |
| Point-in-circle, distance matrix, drawing, print | 146, 151, 159, 93 | rejected: app logic or other Google APIs |

### Regression-test candidates (C7)

- 9: swapping location sets via `Load()` throws RangeError (stack overflow).
- 18, 46: explicit center/zoom overridden by fit-to-locations.
- 52, 55, 65: a single location renders a blank grey map.
- 60: user marker zIndex overwritten by hardcoded 10000.
- 64: dragging a polygon vertex throws TypeError and editing stops.
- 74: custom icon width/height not applied (PR fix).
- 79: map created in a hidden container renders partially once shown.
- 88: zoom option ignored for directions type.
- 94, 161: `SetLocations`/`Load` duplicates the list controls.
- 127: map listeners fire once on load, never on click.
- 132: 0.2.6 stopped rendering maps that 0.2.5 rendered.
- 137 (fix in 141): close-infowindow events fire on reopen, not on close.
- 147: `afterRoute` omits status/result after drag; fires twice on load.
- 164: polygon midpoint drag (`insert_at`) emits no change (PR fix).
- 178: polyline vertex drag throws TypeError in `trigger_polyEv`.
- 183: TypeError on pages without a map element (jQuery 3).
- 186: second instance on the same page does not render.

### Open items: R5 action

| # | Kind | Action | Why |
|---|---|---|---|
| 10 | issue | fixed by 1.0 | Per-location types mix on one map (C3) |
| 21 | issue | fixed by 1.0 | language/region attributes (D5) |
| 38 | pr | out of scope | Layers go on user's own map (G1). Carry: nothing |
| 43 | issue | fixed by 1.0 | Polygons and markers mix (C3) |
| 45 | issue | fixed by 1.0 | importLibrary, element idle until needed (D5, V7) |
| 54 | pr | fixed by 1.0 | Clustering capability (G7). Carry: test clusters resync on remove/replace and list select |
| 61 | issue | out of scope | Traffic layer on user's own map (G1) |
| 68 | issue | out of scope | KML layer on user's own map (G1) |
| 78 | issue | out of scope | Single route per map (D22) |
| 79 | issue | fixed by 1.0 | Re-apply viewport when container is shown or resized (G10) |
| 101 | issue | fixed by 1.0 | HTML marker content holds labels (D6, D20) |
| 103 | issue | out of scope | Data layers not a 1.0 feature |
| 108 | issue | out of scope | Framework integration question, no product signal |
| 109 | issue | fixed by 1.0 | Viewport intent controls centering (G5) |
| 117 | issue | still relevant | Groups/filter decided in A3 |
| 130 | issue | fixed by 1.0 | Update circle radius via store (C2) |
| 134 | issue | fixed by 1.0 | Static standalone examples (W2, W4) |
| 136 | issue | fixed by 1.0 | Re-fit on resize (G10) |
| 144 | issue | fixed by 1.0 | Route stops render as our own markers (D22) |
| 154 | issue | fixed by 1.0 | Resize handling (G10) |
| 170 | issue | out of scope | Geocoding post-1.0 (N7) |
| 171 | issue | still relevant | Info-window mounted event decided in A3 |
| 172 | issue | fixed by 1.0 | Id diffing keeps viewport on updates (C2, G5) |
| 174 | issue | out of scope | Address data needs geocoding (N7) |
| 177 | issue | out of scope | Single route, no alternatives (D22) |
| 178 | issue | fixed by 1.0 | Code replaced; keep as C7 test |
| 179 | issue | fixed by 1.0 | Polylines and markers mix (C3) |
| 180 | issue | out of scope | Off-road routing is a provider limitation |
| 181 | pr | out of scope | README rewritten (P6). Carry: nothing |
| 182 | issue | fixed by 1.0 | Self-contained examples (W2) |
| 183 | issue | fixed by 1.0 | No jQuery, no globals, element-scoped (C5) |
| 185 | issue | fixed by 1.0 | jQuery dependency removed |
| 186 | issue | fixed by 1.0 | Many instances per page (C5); C7 test |
| 188 | issue | out of scope | GeoJSON helper post-1.0 |
| 189 | issue | fixed by 1.0 | Domain renewal (F7) |
| 190 | issue | fixed by 1.0 | Clustering and fit all (G7, G5) |
| 192 | issue | still relevant | Selected state for icons decided in A3 |
| 193 | issue | fixed by 1.0 | Multiple types per map (C3) |
| 194 | issue | fixed by 1.0 | Typed click/select events (C4) |
| 195 | issue | still relevant | Viewport-changed event decided in A3 |
| 197 | issue | still relevant | Hover-open trigger decided in A3 |
| 198 | issue | still relevant | Info-window offset decided in A3 |
