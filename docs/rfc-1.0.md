# maplace 1.0 RFC

Status: frozen on 2026-10-12 for 1.0. Every decision states its own reason; the types in [`packages/maplace/src/`](../packages/maplace/src/) are the reference. After the freeze, an API change edits this document in the same commit as the types; git history is the record.

1. Positioning
2. Use cases
3. API: glossary, shape, loading and packaging, rules, errors, decisions from the 0.2 issues, numbers, performance
4. Migrating from 0.2

Appendix A: 0.2 issue triage

## 1. Positioning

A list of your locations becomes a map with a synced list, in about five lines. Google Maps today, MapLibre next.

### The five-line promise

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
- Shows it as a map plus a list or a native select, with selection, hover and viewport kept in sync both ways.
- Location types: markers, circles, polylines, polygons; one route through your own locations.
- Clustering for large lists.
- Accessible list controls (keyboard, ARIA, native `<select>`).
- Typed events for selection, edits, routes and errors.
- Consent-friendly loading: with `hold`, the element stays idle, with no request to the map provider, until the page calls `release()`.
- Many maps per page, no globals, no framework required.

### Principles

- **Your data, not a provider's.** maplace renders the locations you own; provider services are optional extras.
- **Provider behind an adapter.** No provider types leak into the core or the public API, so MapLibre is a new adapter, not a rewrite (§3 Loading).
- **Nothing global.** Every map is independent; the only shared thing is the provider's own script.
- **Safe by default.** Strings render as text; HTML needs an explicit sanitizer.
- **Accessible.** The list is the accessible way into the map, not an afterthought.
- **Small.** Separate entries, and clustering loads only when used (§3 Loading); you pay only for what you use.
- **Loud errors.** Bad input or a missing key reports what is wrong and where, never a silent grey map.

### Non-goals for 1.0

| Not this | Why |
|---|---|
| A GIS or layer toolkit (KML, traffic, heatmaps, data layers) | Add them to the underlying map object, which maplace exposes; they don't serve "list of places ↔ map". |
| Drawing tools | An editor is a different product; locations can be moved and reshaped, not drawn from scratch. |
| Geocoding addresses | Needs a provider service and quotas; locations come with coordinates in 1.0. |
| A store-locator product (distance matrix, opening hours, booking) | Store locators are one use case; those features are app logic or a dedicated component (see below). |
| Route alternatives or several routes per map | One route through your own locations covers the 0.2 use; more turns maplace into a routing UI. |
| Other provider services (places search, distance, elevation) | Not in 1.0; Places integration is a likely later addition. |
| A React map toolkit | Excellent ones exist (see below); maplace's job is the data list and selection, in any framework. |
| Legacy browsers | Evergreen browsers only (§3 Loading). |
| 0.2 API compatibility | The 0.2 API was index-based and jQuery-shaped; §4 (and the MIGRATION.md written from it) shows a short data conversion instead. |

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

React binding; MapLibre adapter; Places integration (search box that adds locations, place details as content); locations from addresses (geocoding); GeoJSON import; a "my location" control; route options (avoid tolls, highways, ferries); long-list rendering.

### How we'll know it worked

- The five-line snippet runs from a blank HTML file with only an API key.
- A typical 0.2 page migrates by following §4 (MIGRATION.md) in under 30 minutes.
- None of the "pick it when" cases above is something maplace does half-way.

## 2. Use cases

Ten scenarios, each written three ways against the API: an HTML page using `<maplace-map>`, vanilla TypeScript, and React (1.x draft). They live in [`packages/maplace/examples/`](../packages/maplace/examples/); the TypeScript and React versions type-check against the API in CI, and the HTML versions will run in the end-to-end tests. Together they mirror the 0.2 demo site, so every 0.2 user can find their case.

| Scenario | Shows | 0.2 equivalent | 0.2 issues it answers |
|---|---|---|---|
| [simple](../packages/maplace/examples/simple/) | One marker, nothing else | simple | #52, #55, #65 (single location) |
| [markers](../packages/maplace/examples/markers/) | Markers, popup content from a `<template>` or string, custom icon, list | markers | #37, #60, #101, #192 (icons) |
| [circles](../packages/maplace/examples/circles/) | Circles with radius in metres | circles | #13, #130 |
| [menu](../packages/maplace/examples/menu/) | Native `<select>` (on the map in HTML; beside it in vanilla and React), groups, a "fit all" entry; group filter in the vanilla version | menu (dropdown) | #15, #40, #117 (groups) |
| [tabs](../packages/maplace/examples/tabs/) | List outside the map, details panel driven by the `select` event | tabs | #5, #84, #122 |
| [polyline](../packages/maplace/examples/polyline/) | One polyline location, inline JSON data | polyline | #178 |
| [polygon](../packages/maplace/examples/polygon/) | Editable polygon, edits written back, `change` event | polygon | #64, #164 |
| [route](../packages/maplace/examples/route/) | One route through ordered stops, distance from the `route` event | directions | #121, #147 |
| [mixed](../packages/maplace/examples/mixed/) | Markers and circles together, data fetched by the page | mixed (ajax) | #43, #134, #179, #193 |
| [big](../packages/maplace/examples/big/) | 4,000 locations with clustering | big | #3, #54, #174, #182 |

What the scenarios settled:

- **Data in the element** comes from `<maplace-location>` children, an inline `<script type="application/json">` child, or the `locations` property. The element never fetches; pages load data with `fetch` and assign it.
- **Shapes are single locations.** In 0.2 a polyline or polygon turned every location into a vertex and listed the vertices. In 1.0 a polyline is one location with a `path`; mark points of interest along it as separate markers if they belong in the list.
- **The list is the element's own view.** `list` puts a list beside the map, `list="select"` a native select, and `list-position` places it on or outside the map.

## 3. API

This section explains the declarations in [`packages/maplace/src/`](../packages/maplace/src/) and their compile-time tests in `src/__typetests__/`.

### Glossary

| Term | Meaning |
|---|---|
| location | One item of your data: a marker, circle, polyline or polygon, with a unique `id` |
| selection | The one location currently chosen (`selectedId`), shared by map and list |
| hover | The location under the pointer or keyboard focus (`hoveredId`) |
| view | What you asked the map to show: fit all, a box, a centre and zoom, or one location (what selecting asks for) |
| bounds | A box on the map: south, west, north, east; west greater than east crosses the antimeridian |
| viewport | What the map actually shows, as reported by the provider; zoom and bounds mean the same on every provider (see `Viewport`, `Bounds`) |
| popup | The bubble that opens on a location (Google's InfoWindow, MapLibre's Popup). It follows the selection (or the hover with `openOn: 'hover'`); with `openOn: 'click'`, closing it deselects. On a shape it points at a centre point: a circle's centre, the centre of a polygon's bounds, halfway along a polyline. New content refreshes an open popup where it is |
| route | One path through your own locations, in order |
| filter | The groups currently shown; locations without a group hide while a filter is set, and hiding the selected location deselects it |
| adapter | The bridge to a map provider (Google now, MapLibre next) |
| list view | The UI that renders locations as a list or select and asks the store for changes |
| capability | A feature an adapter may or may not support: route, cluster, circle, edit |
| geometry | Where a location is: a point, a circle, a path or a polygon; what a drag or edit changes |
| drawable | A location as an adapter receives it, resolved by the store: geometry, title, style, `editable`, and builders for content and icon (a builder whose page code failed returns nothing: the default marker, no popup) |
| style | How a shape or route line is drawn: a stroke, and for circles and polygons a fill |
| location state | Whether a location is selected and hovered (`LocationState`), passed to `icon` and list `render` functions |
| load state | `idle`, `loading`, `ready` or `error`: where the map is in loading its provider (`loadState`) |
| data | Your own fields on a location, typed through `createMaplace<Data>()` and handed back to content, icon and render functions |

### Shape

- **Core (`maplace`)**: `createMaplace(options?)` returns a headless store: `subscribe`/`getSnapshot` (works with React's `useSyncExternalStore`), `setLocations`, `select`, `hover`, `setFilter`, `fitAll`, `fitBounds`, `setView`, `setRoute`, `on`, `attach` (returns `detach`), `whenReady`, `destroy`.
- **Initial state**: options take `locations`, `selectedId`, `sanitize`, a default shape `style`, `popup`, `cluster` and `view`. The first view is the given `view`, else the selected location, else all locations fitted. Fit padding defaults to 40 px; a fit never zooms in past 15: a box that would need more (one location, or locations metres apart) is centred at 15. Later, `select(id, { zoom })` pans and zooms; `{ pan: false }` leaves the map where it is. The snapshot (`locations`, `selectedId`, `hoveredId`, `filter`, `view`, `viewport`, `route`, `routeResult`, `loadState`) is immutable and replaced on every change; unchanged parts keep their reference, and a location counts as updated when its object changes (objects reused from the last call are not validated again).
- **Locations** are a union on `type`: markers (the default) take `lat`/`lng`, circles `center` + `radius` in metres, polylines `path`, polygons `path` + optional `holes`. Ids are yours (maplace never generates them) and coordinates are `lat`/`lng`, as Google and MapLibre name them. All take `id`, `title`, `content`, `html`, `group`, `visible`, `editable` and `data`; markers take an `icon`, shapes a `style` (polylines have no fill). Optional fields accept an explicit `undefined`, so mapping data across stays simple.
- **Content** is a string (always rendered as text), a DOM node, or a function returning one. `html` is accepted only with a `sanitize` option.
- **Events**: `select`, `hover`, `change` (after a drag or edit, already written back to the store), `popupOpen` (content is in the DOM; again when an open popup gets new content), `popupClose`, `viewport` (after each move ends, the user's too, and once the map first shows), `route` (`result` undefined when cleared), `error`. `on()` returns an unsubscribe function and accepts an `AbortSignal`.
- **Adapter contract**: `mount({ container, host, signal, cluster, popup })`, `apply` (a diff: added and updated locations as `Drawable`s, removed ones as ids, removed applied first; a location whose type changed arrives as removed and added; resolves once drawn), `present` (selection, hover, hidden ids), `setView` (a `ResolvedView`: a box, fitted no closer than zoom 15, a centre and zoom, or one location, brought to the point its popup points at; the store resolves fit-all to a box once, antimeridian included; with nothing shown yet, once there is something to fit), `setRoute`, `mountControl` (a view placed in a corner of the map whenever it is called, taken off on destroy; the node is moved, never changed, and its input never moves the map), `destroy`, `capabilities`, an optional `routeStopLimit`, and an optional `pageMapElement` (the element of a map the page made, when the adapter draws on one; `attach`'s container must be it or hold it). One adapter instance drives one map.
- **Adapter host**: adapters report back only through it, and never read or write the store: `reportSelect`, `reportHover`, `reportChange` (the new geometry), `reportPopupOpen`, `reportPopupClose`, `reportViewport`, `reportRoute`, `reportError`. Reports about locations the store no longer shows, or route results for other stops, are races and ignored; a report the store can't take (a write-back for a location that isn't `editable`, a viewport no map shows) changes nothing and is rethrown in a microtask, never into the adapter.
- **Google (`maplace/google`)**: `createGoogleAdapter({ mapId, colorScheme?, map?, mapOptions? })`, the only entry that knows `google.maps` (loading in §3 Loading). Provider options belong to the adapter, never to the store; `mapOptions` excludes centre and zoom, which only `view` sets, and JSON `styles` (see Google markers and styling). A map maplace creates is a new element filling the container (size the container), removed on `destroy`. With `map`, maplace draws on your map and never moves it in the page or removes it (the store's `view` still sets its camera): `attach`'s container must be `map.getDiv()` or hold it, `mapOptions` and `colorScheme` are refused (set them on your map), your map's own map ID applies (keep `mapId` the same), and `destroy` removes only what maplace added. Google shows no markers on a map made without a map ID: on your own map that is `provider-load-failed` with `field: 'mapId'`, and `whenReady` waits for Google's answer (not while the map is hidden; then it comes once shown). Google refusing the key (`gm_authFailure`: an invalid key, a referrer the key doesn't allow, the API or billing not enabled, a quota used up) is `provider-auth-failed` for every map on the page, attached before or after the refusal; your own `gm_authFailure` still runs, set before maplace or after. Google checks the key as the first map opens, so this can come after `ready`; maplace then stops drawing and leaves the map, with Google's message on it, until `destroy`. A missing key isn't refused (Google draws the map, logging `ApiProjectMapError`), so it reports nothing.
- **Views**: `createListView(maplace, { as, groupHeadings, fitAllLabel, label, render })` (`fitAllLabel` adds a first entry that clears the selection and fits all; `label` names the list, default "Locations"; `render` is for `as: 'list'` only) returns a `ListView`: `{ element, destroy }`. The list sets the store's hover from the pointer and keyboard focus (`hover(id)`), so the map highlights what the list points at; hover never pans the map.
- **Element (`maplace/element`, `maplace/element/google`)**: `<maplace-map>` and `<maplace-location>`; attributes, properties and `maplace-*` DOM events are listed in [`src/element/`](../packages/maplace/src/element/). `<maplace-location>` takes `location-id` (not `id`, which must be unique per page) and an optional `<template>` child: author markup, trusted, so it skips `sanitize` (`html` set through `locations` still needs it). `defineProvider(name, factory)` registers a provider; `release()` starts an element held with `hold`.
- **React (1.x draft)**: `<MaplaceProvider locations>` with `on<Event>` props derived from the event map, optional controlled `selectedId`, `filter`, `route`, and `defaultSelectedId` for an uncontrolled start; other options are read once, on mount; `<MaplaceMap createAdapter>` (a fresh adapter per mount; attaches on mount, detaches on unmount); `<LocationList>`; `useMaplace()`.

### Loading, providers and packaging

- **One package, separate entries**: `maplace` (store, list view, adapter contract), `maplace/google`, `maplace/element`, `maplace/element/google`; `maplace/react` in 1.x and `maplace/maplibre` later. One version for all. `@googlemaps/markerclusterer`, `react` and `maplibre-gl` are optional peers. The CDN gets two scripts, `maplace-element.iife.js` and `maplace-element-cluster.iife.js` (clustering bundled, nothing fetched from other origins at runtime). Evergreen browsers only (ES2020): no transpiling for old browsers keeps the builds small.
- **One copy per page**: defining the elements is idempotent. A second, different copy of maplace logs an error and leaves the first in place; providers registered by the second copy are not seen, so its maps report an unknown `provider` (`invalid-input`).
- **Loading Google Maps**: nothing reads `google` at import time; the adapter calls the global `google.maps.importLibrary`, which works with Google's bootstrap snippet and with js-api-loader, so there is no loader dependency. Only the element's Google provider adds the bootstrap itself, from `api-key`, `version`, `language`, `region` and `nonce` (for CSP): one shared script per page however many maps, never added while the element is held. A second element with a different `api-key`, `version`, `language` or `region` is misuse. Without `google.maps.importLibrary` (an old or missing Maps JS) loading fails with `provider-load-failed`.
- **Google markers and styling**: advanced markers only, the legacy `Marker` being deprecated, so a map ID is required (`DEMO_MAP_ID`, Google's public demo ID, for development). Styling is the map ID's Cloud styling plus `colorScheme`; JSON `styles` are not offered because Google ignores them on maps with a map ID.
- **Routes**: Google's Routes library; it needs Maps JS 3.63 or later, else `route-failed`. Stops: 2 to `routeStopLimit` of your own locations (27 on Google), each still an ordinary, selectable location; removing a stop's location drops it, and below two stops the route clears. A route is computed at most once per task, and only when stops, their positions or the travel mode change (after a drag, only when it ends), because each computation is billed; `setRoute` with an equal route (same stops in order, travel mode and style) changes nothing and keeps the old reference; a change of `style` alone redraws the line without recomputing.
- **Ready for MapLibre**: no provider type appears outside the provider's entry; the store speaks its own `LatLng`, `Bounds`, zoom scale and DOM-node content, and what differs between providers is a capability. A MapLibre adapter is new code behind the same contract, not a change to it.

### Rules the API follows

- camelCase throughout. Verbs for methods, nouns for types, one word per concept (see the glossary); no aliases and no two ways to do the same thing.
- At most two positional arguments, then an options object; never a boolean flag (`select(id, { pan: false })`, not `select(id, false)`).
- Absence is `undefined`, never `null`.
- Each function does one thing: `attach` connects (and throws on misuse), its returned `detach` disconnects, `whenReady` waits for loading (called before `attach` or across `detach`, it waits for the next load; after `destroy` it rejects with `destroyed`).
- Views know only the store, adapters know only their host, and only the element (or your code) wires them together.

### Errors

- **Misuse throws** a `MaplaceError` from the call that caused it, with a `code`, the `locationId` and the `field`:

  | Code | When |
  |---|---|
  | `invalid-input` | Bad data or arguments: `lon` instead of `lng`, a circle without a radius, coordinates out of range (or given as strings), a polyline under 2 points or a polygon or hole under 3, a fill on a polyline, an unknown field (0.2 names get their 1.0 replacement; your own fields go in `data`), both `content` and `html`, a box with south above north, `zoom` with `pan: false`, selecting or hovering a hidden location, `render` with `as: 'select'`, fewer than two or more than `routeStopLimit` route stops, element setup per §3 Loading, an unknown or ambiguous element `provider`, a container that doesn't hold the map the adapter draws on (`pageMapElement`) |
  | `duplicate-id` | Two locations with one id |
  | `unknown-id` | An id not in the store (`select`, `hover`, `selectedId`, a route stop); checked before the stop count |
  | `missing-sanitizer` | `html` without `sanitize` |
  | `unsupported-capability` | A feature the adapter lacks |
  | `already-attached` | A store attached twice, or an adapter instance reused |
  | `destroyed` | A call after `destroy` that changes state or adds a listener; `getSnapshot`, a second `destroy` and unsubscribe functions stay safe |
- **Runtime failures are events**, never throws: `provider-load-failed`, `provider-auth-failed`, `route-failed`. For the first two, `loadState` becomes `error` and `whenReady()` rejects; one that comes after `ready` (Google refuses a key once its first map shows) moves `loadState` from `ready` to `error`, and later `whenReady()` calls reject.
- **Your own code failing while the map draws**: an `icon` or `content` function, or `sanitize`, that throws or returns something other than a Node is an `invalid-input` error event naming the location and field, with what was thrown as `cause`, once until that `icon`, `content` or `html` changes. The map stays ready and draws the default marker, or opens no popup. The store catches it, so every adapter behaves alike.
- **When capabilities are checked**: before `attach` the store skips capability checks (other misuse still throws); `attach` checks the current state against the adapter and throws; afterwards each call checks before changing anything. The adapter's `routeStopLimit` is checked the same way. Applying changes to the map never throws.
- **In the element**, where no caller can catch a throw, misuse sets the error state and dispatches `maplace-error`. Nothing fails silently.

### Decisions from the 0.2 issues

| Need (issues) | Decision |
|---|---|
| Categories and filters (#15, #36, #40, #44, #85, #87, #117, #143) | `group` on a location, `setFilter(groups)` on the store; the list shows group headings |
| Saving dragged or edited shapes (#48, #49, #64, #107, #155, #164, #178) | The store writes the new geometry back and fires `change`; pages save from the event |
| Map container sizing and styles (#23, #184) | The element never sets inline styles on itself; default styles use `:where()` so pages override them; the page sets the height |
| Popup width and offset (#86, #160, #198) | `popup: { maxWidth, offset }` |
| Open on hover (#197) | `popup: { openOn: 'hover' }`; default `click` |
| Different icon when selected (#192) | DOM markers carry `data-selected` / `data-hovered` while in that state, for CSS; an `icon` function receives `(location, LocationState)` and re-runs only when the state changes |
| Act on popup content once shown (#171) | `popupOpen` fires after the content is in the DOM, with the element |
| React to zoom and pan (#195) | `viewport` event after each move ends |
| Large data sets (#3, #54, #95, #174, #182) | See Performance below |
| Hidden or resized containers (#1, #79, #83, #136, #154, #173) | The adapter watches the container's size: a view sent while it has none (a closed tab or dialog) waits, and no viewport is reported, until it is shown; once shown, and after each resize, the last view is shown again unless the user moved the map since (a fit stays fitted as a side panel opens; after a drag or zoom, a resize keeps what the user chose) |
| Silent grey map on bad input (#63, #125, #145, #149, #175) | Validation per the error rules above |
| Explicit centre overridden by fit (#18, #46) | An explicit `view` wins over `selectedId` and fit (see Shape) |
| Marker stacking order (#60) | The hovered location stacks on top, then the selected one, otherwise in the order they were added (a reorder alone doesn't restack); no `zIndex` field |
| Shape colours (stroke and circle options in 0.2) | Neutral `style` per shape and a default `style` option; the store merges them, adapters map the result |

### Numbers

Checked in CI from the first build:

| | Budget (gzip) |
|---|---|
| Core (`maplace`) | ≤ 4 kB |
| Google adapter (`maplace/google`) | ≤ 10 kB |
| Element CDN build (core + Google + list view + element) | ≤ 15 kB |
| Element CDN build with clustering | ≤ 25 kB |

Test coverage: core ≥ 95% of lines, whole package ≥ 85%.

### Performance

Measured on 2026-10-11 with the 0.2 "big" data set (4,000 locations, repeated for 8,000): 10-core laptop, Chrome 152, 1280×800 map, median of three runs after a warm-up. "Smooth" means idle within 1.5 s, no task over 200 ms, at least 45 fps while panning and zooming, selection within 50 ms, with margin for slower machines. Cells are fps / longest task.

| Markers | Google, one element each | Google, clustered | MapLibre, one element each | MapLibre, GPU layer |
|---|---|---|---|---|
| 1,000 | 60 / 70 ms | 60 / 61 ms | 59 / 72 ms | 60 / – |
| 2,000 | 41 / 453 ms | not run | not run | not run |
| 4,000 | 14 / 825 ms | 60 / 210 ms (once, at load) | 15 / 291 ms | 60 / – |
| 8,000 | unresponsive | 60 / 395 ms (once, at load) | 7 / 1,147 ms | 60 / – |

A plain element per Google marker is a little faster than Google's default pin (50 fps at 2,000) but hits the same limit.

Decisions:

- Google keeps advanced markers only. Above about 1,000 markers, pages set `cluster`, and the docs and the "big" example show it.
- Default markers (no `icon`) may be drawn without DOM; the MapLibre adapter uses a GPU layer. Custom icons are DOM on every provider.
- Adapters draw large diffs in chunks so no task exceeds 200 ms. The one exception allowed: if clustering can't be split, its single clustering pass at load (210 ms at 4,000, 395 ms at 8,000) is accepted; this is measured when clustering is built.

## 4. Migrating from 0.2

Everything a 0.2 page could touch, from the source and README of tag `0.2.10` and the old docs site, and what 1.0 does with it. "Dropped" always names the replacement or the reason. [`examples/migrate/from-0.2.ts`](../packages/maplace/examples/migrate/from-0.2.ts) converts 0.2 locations in a few lines and type-checks in CI.

### Options

| 0.2 option | 1.0 |
|---|---|
| `map_div` | the container passed to `attach`, or `<maplace-map>` itself |
| `controls_div`, `controls_on_map`, `controls_position` | element `list-position` (a corner, or `outside`); in code, put `listView.element` anywhere in the page or on the map with `adapter.mountControl` |
| `generate_controls`, `force_generate_controls` | a list exists only when asked for, at any number of locations |
| `controls_type` (`dropdown` \| `list`) | list view `as: 'select' \| 'list'`, element `list="select"` / `list` |
| `controls_cssclass`, `controls_applycss` | your own classes; default styles use `:where()` so yours win |
| `controls_title` | dropped: a heading in your page |
| `type` (one per map) | `type` per location, so one map mixes markers and shapes |
| `type: 'directions'` | `setRoute({ stops })` through your own locations |
| `type: 'fusion'`, `fusion_options` | dropped: Google shut down Fusion Tables in 2019 |
| `view_all`, `view_all_text` | `fitAllLabel` (element `fit-all-label`); no entry unless set |
| `start` | `selectedId` (element `selected-id`, React `defaultSelectedId`) |
| `locations` | kept; every location needs an `id` |
| `shared` (the README calls it `commons`) | dropped: spread your defaults when mapping the data |
| `show_markers` | `visible: false` per location; to centre a map without markers, `view: { kind: 'center', … }` |
| `show_infowindows`, `infowindow_type` | leave `content` out; there is only one kind of popup |
| `map_options` (with `set_center`, `zoom`) | `createGoogleAdapter({ mapOptions })`; centre and zoom through `view` |
| `styles` | map ID and Cloud styling (§3 Loading) |
| `stroke_options`, `circle_options` | `style` option and per-location `style`; the circle's `radius` is a field |
| `directions_options.travelMode` | `route.travelMode` |
| `directions_options.avoidHighways`, `avoidTolls` | not in 1.0; route modifiers may come later |
| `directions_options.unitSystem` | dropped: results are metres and seconds, format them as you like |
| `directions_options.optimizeWaypoints`, `provideRouteAlternatives` | dropped: one route per map, stops in your order |
| `directions_panel` | dropped: render legs from the `route` event |
| `draggable`, `editable` (map-wide) | `editable` per location, for markers and shapes alike; dragging the route itself is gone |
| `listeners` | pass your own map (`createGoogleAdapter({ map })`) and add listeners to it |
| `pan_on_click` | `select(id, { pan: false })` from code; the map always pans to a clicked location |
| `debug` | the `error` event and `MaplaceError`; nothing is logged or silent |
| `visualRefresh` | dropped: Google removed the flag |

### Location fields

| 0.2 field | 1.0 |
|---|---|
| (array index) | `id`, required and unique |
| `lat` | kept |
| `lon` | `lng`, no alias |
| `title` | kept; plain text, also the marker's accessible name |
| `html` | `content` (text, a DOM node or a function), or `html` with a `sanitize` option |
| `%index`, `%title` in `html` | a `content` function |
| `infoWindowMaxWidth` | `popup.maxWidth`, for all popups |
| `icon` | kept: an image URL, a DOM node or a function of the selected/hovered state |
| `image`, `image_w`, `image_h` | an `icon` node, e.g. a sized `<img>` |
| `zoom` | `select(id, { zoom })`; keep the number in `data` |
| `show_infowindow` | leave `content` out |
| `visible` | kept, default `true` (0.2's docs said `false`, its code did `true`) |
| `animation` | dropped: animate the `icon` node with CSS |
| `stopover` | dropped: every route stop ends a leg |
| `stroke_options`, `circle_options` | `style`; the circle's `radius` |
| `type` | kept: `marker`, `circle`, `polyline`, `polygon`; a polyline or polygon is one location with a `path` |
| `zIndex` | dropped: stacking order is fixed (§3, decisions from the 0.2 issues) |
| `on_menu` | dropped: build your own list from `subscribe` for a partial menu |
| `pan_on_click` | dropped per location |
| `draggable` | `editable`: one word for dragging markers and reshaping shapes |
| any other field, including Google marker options | your fields go in `data`; Google options belong on your own map |

### Methods

| 0.2 method | 1.0 |
|---|---|
| `new Maplace(options).Load()` | `createMaplace(options)` then `attach(adapter, container)`, or `<maplace-map>` |
| `Load(options)` | the setter for what changed: `setLocations`, `setRoute`, `setFilter`, `setView` |
| `Load(true)` (rebuild) | `detach()`, then `attach()` with a new adapter |
| `Loaded()` | `getSnapshot().loadState`, or `await whenReady()` |
| `ViewOnMap(index)` | `select(id)` |
| `ViewOnMap('all')` | `select(undefined)` and `fitAll()` |
| `CloseInfoWindow()` | `select(undefined)`: the popup follows the selection |
| `SetLocations(locations, reload)` | `setLocations(locations)`; only the differences reach the map |
| `AddLocations`, `AddLocation`, `RemoveLocations` | `setLocations` with the new array: one way to change data |
| `ShowOnMenu(index)` | dropped |
| `AddControl(name, menu)` | `createListView(maplace, { render })`, or your own view from `subscribe` and `getSnapshot` |
| internals (`oMap`, `markers`, `circles`, …) | pass your own map and keep the reference |

### Events

| 0.2 callback | 1.0 event |
|---|---|
| `beforeViewAll`, `beforeShow`, `beforeOpenInfowindow`, `beforeCloseInfowindow` | dropped: one event per change, after it happened |
| `afterShow` | `select` |
| `afterViewAll` | `select` with `id` undefined, then `viewport` |
| `afterCreateMarker` | dropped: an `icon` function, or CSS on `data-selected` / `data-hovered` |
| `afterOpenInfowindow`, `afterCloseInfowindow` | `popupOpen` (content is in the DOM; again when an open popup gets new content), `popupClose` |
| `afterRoute` | `route`, with legs, distance and duration |
| `onPolylineClick`, `onPolygonClick` | `select`: shapes are locations |
| `circleRadiusChanged`, `circleCenterChanged`, `dragEnd` | `change`, with the location and its `previous` value |
| `drag`, `dragStart` | dropped |

### Behaviour that changes

- Locations are identified by `id`, not by their 1-based position.
- Polyline, polygon and route points are no longer list entries; route stops are your own locations and stay visible.
- Titles and string content are text. 0.2 inserted titles into the menu as raw HTML.
- No jQuery and no `Maplace` global: ES modules or one CDN script. With the element, Google Maps no longer has to load first (the element adds Google's bootstrap); in code, the page loads it and the adapter imports what it needs.
- The menu's inline styles are replaced by a stylesheet you can override.
- Bugs and requests from the 0.2 issues (explicit centre overridden by fit, hidden containers, stacking, …) are settled in §3, decisions from the 0.2 issues.

Never released (the unmerged `develop` branch): `onPolylineClick` is `select`; the documented manual resize trigger is unnecessary; the `FreezeZoom` / `UnFreezeZoom` stubs are `mapOptions.gestureHandling`.

## Appendix A: 0.2 issue triage

Source: all 178 issues and 20 PRs of the 0.2 repo (2013–2022), read on 2026-10-10. Issue numbers only.

### Usage signals (2026-10-10)

| Signal | Value |
|---|---|
| GitHub stars / forks / watchers | 992 / 186 / 66 |
| npm `maplace-js` downloads, last year / last week | 1,924 / 32 |
| jsDelivr hits for npm `maplace-js`, last year | 838,621 |
| Open issues + PRs | 39 + 3 |

CDN traffic is about 400× npm installs: 0.2 is still served to pages via `<script>`, which supports the CDN/HTML-first 1.0 (§1).

### Themes

Demand = items + reactions + comments.

| Theme | Items | Demand | 1.0 answer |
|---|---|---|---|
| Dynamic location updates (add/remove/set/move) | 9, 56, 72, 94, 114, 138, 149, 153, 161, 168 | 44 (10+0+34) | `setLocations` diffed by id (§3 Shape) |
| Viewport intent: center, zoom, fit, pan | 16, 18, 27, 33, 46, 57, 88, 96, 109, 156, 172, 187, 191 | 37 (13+0+24) | views and the initial-view order (§3 Shape) |
| Info window behaviour and options | 11, 19, 20, 25, 59, 67, 86, 133, 160, 171, 197, 198 | 35 (12+0+23) | popup options and events, content model (§3 Shape, Decisions) |
| Marker icons, size, labels, CSS, z-order | 37, 60, 69, 73, 74, 77, 91, 99, 101, 105, 106, 148, 150, 163, 192 | 31 (15+0+16) | `icon` as URL, node or function; advanced markers (§3 Shape, Loading) |
| Route options and rendering | 6, 31, 51, 70, 92, 120, 135, 144, 169, 177 | 30 (10+0+20) | one route through your locations, Routes library (§3 Loading) |
| Maps API loading, key, language | 21, 22, 45, 66, 100, 102, 128, 132, 183 | 28 (9+0+19) | `importLibrary`, element bootstrap attributes, `hold` (§3 Loading) |
| Native map options and escape hatch | 2, 4, 7, 29, 58, 62, 97, 166 | 27 (8+0+19) | `mapOptions` or your own map; Cloud styling (§3 Shape, Loading) |
| Hidden or resized container rendering | 1, 79, 83, 136, 154, 173 | 26 (6+0+20) | adapters watch the container (§3 Decisions) |
| Groups, categories, filters, layer toggles | 15, 36, 40, 44, 85, 87, 117, 143 | 26 (8+0+18) | `group` and `setFilter`, list group headings (§3 Decisions) |
| Packaging, distribution, jQuery dependency | 26, 30, 50, 71, 82, 104, 112, 113, 116, 118, 119, 162, 185 | 23 (13+0+10) | one package, ES modules and CDN scripts, no jQuery (§3 Loading) |
| Route result data, events, waypoint limits | 121, 129, 139, 142, 147, 176 | 19 (6+0+13) | `route` event with legs; stop limit from the adapter (§3 Loading) |
| Events and callbacks API | 32, 53, 80, 110, 111, 127, 137, 141, 194, 195 | 19 (10+0+9) | one typed event system (§3 Shape) |
| Docs, website, examples | 17, 34, 134, 140, 157, 181, 189, 196 | 18 (8+2+8) | new site with runnable examples (§2) |
| Overlay layers (KML, traffic, bicycling, Data/GeoJSON) | 28, 38, 61, 68, 81, 103, 188 | 16 (7+0+9) | out of scope: add them to your own map (§1 Non-goals) |
| Single location renders blank map | 52, 55, 65 | 15 (3+0+12) | the initial-view order; kept as a regression test |
| List view and programmatic select | 5, 75, 84, 115, 122 | 14 (5+0+9) | list view and `select` (§3 Shape) |
| Mixed location types on one map | 10, 43, 90, 158, 179, 193 | 13 (6+0+7) | `type` per location (§3 Shape) |
| Geocoding and address input | 8, 24, 126, 131, 170 | 13 (5+0+8) | later: locations from addresses (§1) |
| Setup errors and input validation | 63, 125, 145, 175 | 13 (4+0+9) | misuse throws with code, id and field (§3 Errors) |
| Places and location search (search box, place details, save a place) | 41, 98, 152, 165 | 12 (4+0+8) | later: Places integration (§1) |
| Editable/draggable geometry sync | 48, 49, 64, 107, 155, 164, 178 | 11 (7+0+4) | `editable`, written back, `change` event (§3 Decisions) |
| Circles and shape styling | 13, 76, 130 | 11 (3+0+8) | circles by radius, `style` (§3 Shape) |
| Other Google services (print, drawing, point-in-circle, distance matrix, off-road paths) | 93, 146, 151, 159, 180 | 10 (5+0+5) | out of scope: app logic or other Google APIs (§1 Non-goals) |
| Host element CSS and sizing | 23, 184 | 9 (2+0+7) | no inline styles on the element (§3 Decisions) |
| Multiple maps and instance access | 89, 123, 124, 186 | 9 (4+1+4) | no globals, one store per map (§1 Principles) |
| Clustering and dense markers | 3, 54, 190 | 8 (3+0+5) | `cluster` (§3 Performance) |
| Large datasets | 95, 174, 182 | 7 (3+0+4) | measured limits and decisions (§3 Performance) |
| Multiple routes on one map | 78 | 3 (1+0+2) | out of scope: one route per map (§1 Non-goals) |

### Noise

12, 14, 35, 39, 42, 47, 108, 167

### New requirements

All are answered in 1.0 unless marked.

| Requirement | Items | Where |
|---|---|---|
| Observe container size and visibility; re-apply the view when a hidden or resized map becomes visible | 1, 79, 83, 136, 154, 173 | §3 Decisions |
| Validate data and setup, naming location id and field; never a silent grey map | 63, 125, 145, 149, 175 | §3 Errors |
| `group` on a location plus a filter in the store; list group headings | 15, 36, 40, 44, 85, 87, 117, 143 | §3 Decisions |
| Editable markers and shapes write geometry back and emit a typed `change` | 48, 49, 64, 107, 155, 164, 178 | §3 Decisions |
| Never write inline styles on the host element; document the required size | 23, 184 | §3 Decisions |
| Popup options: max width, pixel offset | 86, 160, 198 | §3 Decisions |
| Popup opens on click or hover (`openOn`) | 197 | §3 Decisions |
| Selected state available to marker content | 192 | §3 Decisions |
| Popup open event fires after its content is in the DOM | 171 | §3 Decisions |
| Viewport-changed event | 195 | §3 Decisions |
| GeoJSON FeatureCollection to locations helper | 103, 188 | later (§1) |
| "My location" control, route from the user's position | 169 | later (§1) |
| Several routes on one map, route alternatives | 78, 177 | rejected: one route per map (§1 Non-goals) |
| Built-in traffic, bicycling and KML layers | 38, 61, 68, 81 | rejected: add them to your own map (§1 Non-goals) |
| Places: search box feeding locations, place details as content, save a place | 41, 98, 152, 165 | later (§1) |
| Point-in-circle, distance matrix, drawing, print | 146, 151, 159, 93 | rejected: app logic or other Google APIs (§1 Non-goals) |

### Regression-test candidates

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

### Open items: action at release

| # | Kind | Action | Why |
|---|---|---|---|
| 10 | issue | fixed by 1.0 | Location types mix on one map (§3 Shape) |
| 21 | issue | fixed by 1.0 | `language`/`region` attributes (§3 Loading) |
| 38 | pr | out of scope | Layers go on your own map (§1 Non-goals). Carry: nothing |
| 43 | issue | fixed by 1.0 | Polygons and markers mix (§3 Shape) |
| 45 | issue | fixed by 1.0 | `importLibrary`; the element stays idle until needed (§3 Loading) |
| 54 | pr | fixed by 1.0 | `cluster` (§3 Performance). Carry: test that clusters update on remove/replace and list select |
| 61 | issue | out of scope | Traffic layer on your own map (§1 Non-goals) |
| 68 | issue | out of scope | KML layer on your own map (§1 Non-goals) |
| 78 | issue | out of scope | One route per map (§1 Non-goals) |
| 79 | issue | fixed by 1.0 | View re-applied when the container is shown or resized (§3 Decisions) |
| 101 | issue | fixed by 1.0 | Marker content is a DOM node, so it can hold labels (§3 Shape) |
| 103 | issue | out of scope | Data layers are not a 1.0 feature |
| 108 | issue | out of scope | Framework integration question, no product signal |
| 109 | issue | fixed by 1.0 | Views control centring (§3 Shape) |
| 117 | issue | fixed by 1.0 | `group` and `setFilter` (§3 Decisions) |
| 130 | issue | fixed by 1.0 | Circle radius updated through the store (§3 Shape) |
| 134 | issue | fixed by 1.0 | Standalone examples (§2) |
| 136 | issue | fixed by 1.0 | Re-fit on resize (§3 Decisions) |
| 144 | issue | fixed by 1.0 | Route stops are your own locations (§3 Loading) |
| 154 | issue | fixed by 1.0 | Resize handling (§3 Decisions) |
| 170 | issue | out of scope | Geocoding later (§1) |
| 171 | issue | fixed by 1.0 | `popupOpen` after content is in the DOM (§3 Decisions) |
| 172 | issue | fixed by 1.0 | Diffing by id keeps the viewport on updates (§3 Shape) |
| 174 | issue | out of scope | Address data needs geocoding, later (§1) |
| 177 | issue | out of scope | One route, no alternatives (§1 Non-goals) |
| 178 | issue | fixed by 1.0 | Code replaced; kept as a regression test |
| 179 | issue | fixed by 1.0 | Polylines and markers mix (§3 Shape) |
| 180 | issue | out of scope | Off-road routing is a provider limitation |
| 181 | pr | out of scope | README rewritten for 1.0. Carry: nothing |
| 182 | issue | fixed by 1.0 | Standalone examples (§2) |
| 183 | issue | fixed by 1.0 | No jQuery, no globals, element-scoped (§1 Principles) |
| 185 | issue | fixed by 1.0 | jQuery dependency removed |
| 186 | issue | fixed by 1.0 | Many maps per page (§1 Principles); kept as a regression test |
| 188 | issue | out of scope | GeoJSON helper later (§1) |
| 189 | issue | fixed by 1.0 | Domain renewed for the new site |
| 190 | issue | fixed by 1.0 | Clustering and fit all (§3 Shape, Performance) |
| 192 | issue | fixed by 1.0 | Selected state for icons (§3 Decisions) |
| 193 | issue | fixed by 1.0 | Several types per map (§3 Shape) |
| 194 | issue | fixed by 1.0 | Typed `select` events (§3 Shape) |
| 195 | issue | fixed by 1.0 | `viewport` event (§3 Decisions) |
| 197 | issue | fixed by 1.0 | `openOn: 'hover'` (§3 Decisions) |
| 198 | issue | fixed by 1.0 | Popup `offset` (§3 Decisions) |
