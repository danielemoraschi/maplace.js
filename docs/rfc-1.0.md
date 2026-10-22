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

<!-- example: packages/maplace/examples/quick-start/page.html -->
```html
<script src="https://cdn.jsdelivr.net/npm/maplace@1/dist/maplace-element.iife.js"></script>
<maplace-map api-key="YOUR_KEY" list>
  <maplace-location location-id="rome" lat="41.9028" lng="12.4964" title="Rome"></maplace-location>
  <maplace-location location-id="milan" lat="45.4642" lng="9.19" title="Milan"></maplace-location>
</maplace-map>
```

A map with two markers, a list beside it, and selection kept in sync: click a marker and the list highlights it; pick it in the list and the map pans and opens it.

### Who it is for

1. **Pages with a list of places**: offices, venues, events, trips, stores, built with a `<script>` tag on a CMS or static site. This is the audience 0.2 still serves: about 839k jsDelivr hits a year against about 1.9k npm installs (Appendix A).
2. **Developers in any framework** who want a small headless store (locations keyed by id, selection, viewport) and a map adapter, without adopting a map toolkit.
3. **React users**, through `maplace/react`: a provider, a map and a list, with the selection controlled or not. `<maplace-map>` also works in React 19 as a custom element.

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
| 0.2 API compatibility | The 0.2 API was index-based and jQuery-shaped; [MIGRATION.md](../MIGRATION.md) (once §4) shows a short data conversion instead. |

### How it compares

| | What it is | Framework | Provider | Your data as list + map, selection synced | Pick it when |
|---|---|---|---|---|---|
| **maplace** | Data list → map + list, headless core + adapters | None (element, JS); React bindings | Google; MapLibre next | Yes, the core job | You have a list of places and want map and list in sync with little code |
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

Places integration (search box that adds locations, place details as content); locations from addresses (geocoding); GeoJSON import; a "my location" control; route options (avoid tolls, highways, ferries); long-list rendering.

### How we'll know it worked

- The five-line snippet runs from a blank HTML file with only an API key.
- A typical 0.2 page migrates by following [MIGRATION.md](../MIGRATION.md) in under 30 minutes.
- None of the "pick it when" cases above is something maplace does half-way.

## 2. Use cases

Twelve scenarios, each written three ways against the API: an HTML page using `<maplace-map>`, vanilla TypeScript, and React. They live in [`packages/maplace/examples/`](../packages/maplace/examples/); CI type-checks them and runs all three on a fake map, and all three on Google Maps too. Each vanilla version opens with `createGoogleMap` (custom-list and styled, which need the adapter, with the parts it composes); each vanilla and React version is a complete program with the HTML it mounts on (`vanilla.html`, `react.html`: Maps JS from Google's bootstrap loader), the same map as its page, which a test holds them to. Together they mirror the 0.2 demo site, so every 0.2 user can find their case.

| Scenario | Shows | 0.2 equivalent | 0.2 issues it answers |
|---|---|---|---|
| [simple](../packages/maplace/examples/simple/) | One marker, nothing else | simple | #52, #55, #65 (single location) |
| [markers](../packages/maplace/examples/markers/) | Markers with image icons and a DOM icon, popup content from a `<template>`, a node or React content (one marker with none), a location with its own `zoom`, one not `listed`, the list on the map under a heading, a click on the map (`mapClick`) adding a marker | markers | #37, #60, #101, #192 (icons) |
| [circles](../packages/maplace/examples/circles/) | Circles with radius in metres, each in its own colours with a popup, one selected at start and drawn in its selected style, one `editable` with its radius shown live (`locationEdit`, `locationChange`) | circles | #13, #130 |
| [menu](../packages/maplace/examples/menu/) | Native `<select>` on the map, top right, groups, a "fit all" entry, a North-only filter | menu (dropdown) | #15, #40, #117 (groups) |
| [custom-list](../packages/maplace/examples/custom-list/) | A list view of your own, as 0.2's "checks" menu: a radio per listed location (`listedLocations`) and one to fit all, on the map, top right; in HTML defined by name (`defineListView`) | Adding new menu types | — |
| [tabs](../packages/maplace/examples/tabs/) | List outside the map, styled as tabs, starting on the first place (`selected-id`), details panel driven by the `selectionChange` event | tabs | #5, #84, #122 |
| [polyline](../packages/maplace/examples/polyline/) | An editable polyline with points of interest along it, popups and a list, inline JSON data | polyline | #178 |
| [polygon](../packages/maplace/examples/polygon/) | Editable polygon, edits written back, `locationChange` event | polygon | #64, #164 |
| [route](../packages/maplace/examples/route/) | One route through ordered stops, passing through one (`via`), directions by leg from its steps and the distance, from the `routeChange` event | directions | #121, #147 |
| [mixed](../packages/maplace/examples/mixed/) | 0.2's five data sets fetched by the page and swapped in live: markers, markers with a route through them, a polygon, a circle | mixed (ajax) | #43, #134, #179, #193 |
| [styled](../packages/maplace/examples/styled/) | Google's own look: a light or dark map (`color-scheme`), Google's map options (the map-type control), a toggle opening the map again in the other scheme where it was | styled | — |
| [big](../packages/maplace/examples/big/) | 4,000 locations with clustering | big | #3, #54, #174, #182 |

What the scenarios settled:

- **Data in the element** comes from `<maplace-location>` children, an inline `<script type="application/json">` child, or the `locations` property. The element never fetches; pages load data with `fetch` and assign it.
- **Shapes are single locations.** In 0.2 a polyline or polygon turned every location into a vertex and listed the vertices. In 1.0 a polyline is one location with a `path`; mark points of interest along it as separate markers if they belong in the list.
- **The list is the element's own view.** `list` puts a list beside the map (under it on a screen narrower than 40rem), `list="select"` a native select, `list="<name>"` one of yours given to `defineListView`, and `list-position` places it on or outside the map.

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
| popup | The bubble that opens on a location (Google's InfoWindow, MapLibre's Popup), headed by the location's title when it has one. It follows the selection (or the hover with `openOn: 'hover'`); with `openOn: 'click'`, closing it deselects. On a shape it points at a centre point: a circle's centre, the centre of a polygon's bounds, halfway along a polyline. New content refreshes an open popup where it is |
| route | One path through your own locations, in order; each stop ends a leg unless the route passes through it (`via`), and each leg has its turn-by-turn steps |
| filter | The groups currently shown; locations without a group hide while a filter is set, and hiding the selected location deselects it |
| adapter | The bridge to a map provider (Google now, MapLibre next) |
| list view | The UI that renders locations as a list or select and asks the store for changes |
| capability | A feature an adapter may or may not support: route, cluster, circle, edit |
| geometry | Where a location is: a point, a circle, a path or a polygon; what a drag or edit changes |
| drawable | A location as an adapter receives it, resolved by the store: geometry, title, styles (at rest, selected, hovered), `editable`, and builders for content and icon (a builder whose page code failed returns nothing: the default marker, no popup) |
| style | How a shape or route line is drawn: a stroke, and for circles and polygons a fill. A shape has one at rest, and may have one for selected and one for hovered |
| location state | Whether a location is selected and hovered (`LocationState`), passed to `icon` and list `render` functions |
| load state | `idle`, `loading`, `ready` or `error`: where the map is in loading its provider (`loadState`; on the element also `:state(…)`) |
| data | Your own fields on a location, typed through `createMaplace<Data>()` and handed back to content, icon and render functions |

### Shape

- **Core (`maplace`)**: `createMaplace(options?)` returns a headless store: `subscribe`/`getSnapshot` (works with React's `useSyncExternalStore`), `setLocations`, `select`, `hover`, `setFilter`, `fitAll`, `fitBounds`, `setView`, `setRoute`, `on`, `attach(adapter, container)` (returns `detach`; `container` is an element, or a selector the page's document matches, looked up once with `querySelector`: one matching nothing, or not a valid selector, is `invalid-input` on `container`, and an element in a shadow root is passed as the element), `whenReady`, `destroy`.
- **Initial state**: options take `locations`, `selectedId`, `sanitize`, a default shape `style`, `selectedStyle` and `hoveredStyle`, `popup`, `cluster` and `view`. The first view is the given `view`, else the selected location (a marker without a zoom, asked or its own, fitted as one place is, since a map has no zoom of its own yet), else all locations fitted. Fit padding defaults to 40 px; a fit never zooms in past 15: a box that would need more (one location, or locations metres apart) is centred at 15. Selecting a marker pans to it and selecting a shape fits it (no closer than 15, as any fit), since a shape's centre alone says nothing of its size: two circles round one point would look the same; `select(id, { zoom })` brings either to the point its popup points at, at that zoom; a location's own `zoom` does the same for a selection without one (a click on it, in the list, `selectedId`), the select's winning; `{ pan: false }` leaves the map where it is. The snapshot (`locations`, `selectedId`, `hoveredId`, `filter`, `view`, `viewport`, `route`, `routeResult`, `loadState`) is immutable and replaced on every change; unchanged parts keep their reference, and a location counts as updated when its object changes (objects reused from the last call are not validated again).
- **Locations** are a union on `type`: markers (the default) take `lat`/`lng`, circles `center` + `radius` in metres, polylines `path`, polygons `path` + optional `holes`. Ids are yours (maplace never generates them) and coordinates are `lat`/`lng`, as Google and MapLibre name them. All take `id`, `title`, `content`, `html`, `group`, `visible`, `listed`, `zoom`, `editable` and `data`; `zoom` is the zoom selecting it shows it at, and `listed: false` keeps a location out of every list view while the map draws it and it can be selected there. Markers take an `icon`, shapes a `style`, a `selectedStyle` and a `hoveredStyle` (polylines have no fill). A shape in a state is drawn as maplace's own look for it, then its `style`, then its state style, each the location's over the store's; selected wins over hovered. The state style comes last so a store-wide `selectedStyle` shows on every shape whatever its own colours. Optional fields accept an explicit `undefined`, so mapping data across stays simple.
- **Content** is a string (always rendered as text), a DOM node, or a function returning one. `html` is accepted only with a `sanitize` option.
- **Events**: `selectionChange` (`id` undefined when cleared), `hoverChange`, `mapClick` (a single click on the map itself, not on a location, with its `position`; it clears the selection, `selectionChange` following; a double-click is not a click, so it fires neither, nor does a triple-click), `locationEdit` (while a user drags or reshapes, its geometry so far, never written to the store; the last one is where it ended, just before `locationChange`), `locationChange` (after a drag or edit, already written back to the store), `popupOpen` (content is in the DOM; again when an open popup gets new content), `popupClose`, `viewportChange` (after each move ends, the user's too, and once the map first shows), `routeChange` (`result` undefined when cleared), `error`. Each `…Change` event fires after its change, and only when something changed; no event can be cancelled, and a name says what happened, not when a listener runs. `on()` returns an unsubscribe function and accepts an `AbortSignal`.
- **Adapter contract**: `mount({ container, host, signal, cluster, popup })`, `apply` (a diff: added and updated locations as `Drawable`s, removed ones as ids, removed applied first; a location whose type changed arrives as removed and added; resolves once drawn), `present` (selection, hover, hidden ids), `setView` (a `ResolvedView`: a box, fitted no closer than zoom 15, a centre and zoom, or one location, brought to the point its popup points at (the store fills in a location's own `zoom`; a shape selected with neither comes as its box); the store resolves fit-all to a box once, antimeridian included; with nothing shown yet, once there is something to fit), `setRoute`, `mountControl` (a view placed in a corner of the map whenever it is called, taken off on destroy; the node is moved, never changed, and its input never moves the map), `destroy`, `capabilities`, an optional `routeStopLimit`, and an optional `pageMapElement` (the element of a map the page made, when the adapter draws on one; `attach`'s container must be it or hold it). One adapter instance drives one map.
- **Adapter host**: adapters report back only through it, and never read or write the store: `reportSelectionChange` (a location's id), `reportMapClick` (where; the store clears the selection), `reportHoverChange`, `reportLocationEdit` (the geometry so far, as often as the provider says; the last before `reportLocationChange` is where it ended), `reportLocationChange` (the new geometry), `reportPopupOpen`, `reportPopupClose`, `reportViewportChange`, `reportRouteChange` (the route it computed, as `setRoute` gave it, and the result), `reportError` (a `route-failed` with the route it was computing), each named for the event it can lead to. Reports about locations the store no longer shows, or route results and failures for a route since replaced (other stops, `via` or travel mode) or cleared, are races and ignored; a report the store can't take (an edit or a write-back for a location that isn't `editable`, a click position or a viewport no map shows, a route result whose legs don't run between its route's stops) changes nothing and is rethrown in a microtask, never into the adapter.
- **Google (`maplace/google`)**: `createGoogleAdapter({ mapId?, colorScheme?, map?, mapOptions? }?)`, the only entry that knows `google.maps` (loading in §3 Loading). `createGoogleMap(container, options?)` is the common case in one call, as 0.2's `new Maplace(options).Load()` was: a store made with the store's options, attached to a Google adapter made with `mapId`, `colorScheme` and `mapOptions`, in `container` (an element or a selector, as `attach` takes), returned; `list` adds maplace's list, `true` for the default one or the list view's options with `position`, the corner of the map it goes in (default `top-right`, where 0.2 put its controls), or `container`, an element or a selector of the page it goes in instead (0.2's `controls_div`; both is `invalid-input`). `destroy()` takes the map and its list down. Each part checks what it is handed, so misuse names the part (`createMaplace: options…`, `createGoogleAdapter: options…`, `attach: container…`, `createListView: options…`), and when the store can't be attached it is destroyed before the error goes on. The page's own `map`, a control of the page's own (`mountControl`) and a map opened again (a new adapter) need the adapter, so they take the parts: `createMaplace`, `createGoogleAdapter`, `attach`. Provider options belong to the adapter, never to the store; `mapOptions` excludes centre and zoom, which only `view` sets, and JSON `styles` (see Google markers and styling). A map maplace creates is a new element filling the container (size the container), removed on `destroy`. With `map`, maplace draws on your map and never moves it in the page or removes it (the store's `view` still sets its camera): `attach`'s container must be `map.getDiv()` or hold it, `mapOptions` and `colorScheme` are refused (set them on your map), your map's own map ID applies (keep `mapId` the same), and `destroy` removes only what maplace added. `whenReady` waits for Google to initialise the map, created or yours (at most 2 s, and not while it is hidden): until then Google holds camera moves back and gives clicks on shapes to the map. Google shows no markers on a map made without a map ID: on your own map that is `provider-load-failed` with `field: 'mapId'`, found then (or once a hidden map is shown). Google refusing the key (`gm_authFailure`: an invalid key, a referrer the key doesn't allow, the API or billing not enabled, a quota used up) is `provider-auth-failed` for every map on the page, attached before or after the refusal; your own `gm_authFailure` still runs, set before maplace or after. Google checks the key as the first map opens, so this can come after `ready`; maplace then stops drawing and leaves the map, with Google's message on it, until `destroy`. A missing key isn't refused (Google draws the map, logging `ApiProjectMapError`), so it reports nothing. A click on the map is reported 250 ms after it unless a `dblclick` comes first (a slower double-click is two clicks), and the later clicks of one gesture are none, so a double-click zoom or a triple-click neither fires `mapClick` nor clears the selection; a location clicked within those 250 ms drops the map's click, as the user's last. A marker reports its drag as it moves; Google says where a shape's handle went only when it is let go, so a shape's `locationEdit` comes once, with its `locationChange`.
- **MapLibre (`maplace/maplibre`)**: `createMapLibreAdapter({ mapStyle?, map?, mapOptions? }?)`, the only entry that knows `maplibre-gl` (loading in §3 Loading). `mapStyle` is the map's style, a URL or a style object, OpenFreeMap's `liberty` style when left out (free, no key, OpenStreetMap data), so any provider's style URL works the same way; named `mapStyle`, since a store's `style` is the shapes' default style. `createMapLibreMap(container, options?)` is the common case in one call, as `createGoogleMap` is, with `mapStyle` and `mapOptions` for the adapter and the same `list`, `destroy()` and misuse (a style URL given as `style` is told it is `mapStyle`). The page's own `map` takes the parts, as on Google; with it, `mapStyle` and `mapOptions` are refused. `mapOptions` are MapLibre's map options for a map maplace creates, without `container`, `style`, `center`, `zoom` and `bounds`, which maplace sets; their `minZoom` and `maxZoom` are on MapLibre's scale, one below maplace's. A map maplace creates is a new element filling the container, removed on destroy, opening on the world at zoom 1 and, as Google's 2D map, neither rotating nor tilting unless `mapOptions.dragRotate` turns rotation on. Circles are polygons of 128 points on the sphere, their radius in metres as on Google; polylines and polygons across ±180 are drawn the short way, as on Google; an `editable` shape gets Google's handles (one on each point and one between each two; a circle's centre and four radius handles), pointer-only, its edits reported as the drag goes and its change on release.
- **Views**: `createListView(maplace, { as, groupHeadings, fitAllLabel, label, heading, render })` (`fitAllLabel` adds a first entry that clears the selection and fits all; `label` names the list, default the `heading`, else "Locations"; `heading` shows above the entries, beside the map or on it, the view's `element` then being a block holding the heading and the listbox or select, hidden while the list is; `render` is for `as: 'list'` only) returns a `ListView`: `{ element, destroy }`, its `element` carrying the class `maplace-list-view` whichever it is. `listedLocations(snapshot)` is what these lists list, in data order, so a page's own list lists the same. The list sets the store's hover from the pointer and keyboard focus (`hover(id)`), so the map highlights what the list points at; hover never pans the map. It adopts default styles once per document: options as buttons (padding, pointer, hover and selected backgrounds mixed from `currentColor`, a focus outline), group headings, the heading set apart with the entries scrolling under it; every selector in `:where()`, so any rule of the page wins. Locations with `listed: false` are left out (a group with only those gets no heading); "fit all" still fits them, as it fits what the map shows. As a native select with `fitAllLabel`, "fit all" is what shows while nothing is selected, listed once (choosing it again while shown changes nothing, as a native select fires no change); while a location the list leaves out is selected, no entry shows, so "fit all" can be chosen.
- **Element (`maplace/element`, `maplace/element/google`, `maplace/element/maplibre`)**: `<maplace-map>` and `<maplace-location>`; attributes, properties and `maplace-*` DOM events (the store's events in lower case: `maplace-selectionchange`) are listed in [`src/element/`](../packages/maplace/src/element/). `<maplace-location>` takes `location-id` (not `id`, which must be unique per page) an `icon` (a marker's image URL), a `zoom`, `listed` (`"false"` keeps it out of the list), `editable` (the location's `editable`), `shape-style`, `selected-style` and `hovered-style` (JSON style objects, a shape's `style`, `selectedStyle` and `hoveredStyle`; not `style`, which is HTML's inline CSS and falls under a page's CSP), booleans as HTML writes them (present, empty or `"true"` is true, `"false"` false, anything else misuse naming the attribute), and optional `<template>` children, the popup's content and, marked `data-icon`, the marker in place of `icon` (one element, or a span around the rest), cloned for each state: author markup, trusted, so it skips `sanitize` (`html` set through `locations` still needs it). `defineProvider(name, factory)` registers a provider. `defineListView(name, factory)` registers a list view for `list="<name>"` (built in: `list` empty for a list, `list="select"` a native select): the factory gets the store and a setup, the list options from the attributes (`fitAllLabel`, `heading`) and `listed()`, the locations maplace's own lists show now (shown under the filter), so a view of yours lists what they list; it returns a `ListView`, placed by `list-position` as the built-in ones are. A name defined after the map opened builds its list then, as a provider registered later opens the map; an unknown name, a built-in one, or one defined again with another factory is misuse (`field: 'list'`). A page on the CDN script, which imports nothing, reaches the same function as `customElements.get("maplace-map").defineListView`. `release()` starts an element held with `hold`; a held map builds its list on release too, so a held page's scripts, and the list views they define, can wait for it. Its `sanitize` property is the store's `sanitize` option, so locations given as JSON or through `locations` can use `html`; it is read when the store is created, and changing it later is misuse. A map waits for the document to parse its children before it opens, whether parsed or created by a script, so its first view and `selected-id` see them all. The element's store lives as long as the element: it is created when the element first connects (or `maplace`, `locations` or `route` is first read), from `cluster`, `selected-id` and the locations, and opens its map once the document has parsed the locations inside it; removed, the map closes and the store goes back to `idle`, keeping its locations, selection and listeners, and connected again a new map opens (a move within one task keeps the map). The `locations` property, once set, wins over the locations written inside the element: one inline JSON script or `<maplace-location>` children (both is misuse), watched for changes. `list`, `list-position` (`outside` by default), `fit-all-label` and `list-heading` (a heading above the list, its accessible name) are live, a change of `provider` opens the map again, provider attributes are read when the map opens, a change of `color-scheme`, `map-style` or `map-options` (the map's settings) opens it again where it was, keeping the store's state (a change to the same value does nothing), and `cluster` can't change once the store exists. `maplace-*` events bubble. The element's `loadState` is the store's, or `error` while a misuse stands; it is shown as the custom state `:state(idle)` (also `loading`, `ready`, `error`), so a page styles a consent placeholder with CSS, and the element never writes its own attributes or styles. Its default styles (layout) are an adopted stylesheet, every selector in `:where()`, as the list's and the popups' are.
- **React (`maplace/react`)**: `<MaplaceProvider locations>` makes one store for its children and keeps it as long as it is mounted, with `on<Event>` props derived from the event map. `locations` is applied when the array changes, never otherwise, so an edit on the map outlives a render. A controlled `selectedId` (the prop present, `undefined` meaning nothing selected) is the selection: one the user or app code makes calls `onSelectionChange`, and unless the parent passes it back in that render the store goes back to the prop (and pans back), so `onSelectionChange` sets state synchronously; changes the prop makes call nothing. A `filter` or `route` prop (present even as `undefined`) is applied when its value changes, as `locations` is: an equal one costs nothing, and one app code sets through the store stands until the prop next changes (a route is computed, and billed, once per change). `defaultSelectedId` starts an uncontrolled selection; either id, if not shown yet (locations still loading, or filtered out), waits until it is, as the element's `selected-id` does. Changing `selectedId` between controlled and not after mount, or giving it and `defaultSelectedId` both, is `invalid-input`. The other options are read once, on mount. `<MaplaceMap createAdapter className>` renders a div you size and attaches a fresh adapter to it on mount (`createAdapter` is any adapter factory: `createGoogleAdapter`, `createMapLibreAdapter`, or a function making one with options), detaching on unmount, so StrictMode and `<Activity>` work. It also takes `popupContent(location)` and `markerIcon(location, state)`, which render a popup's content and a marker's icon as React content, through a portal into one host per location (an icon's host carries `data-selected` and `data-hovered`, as core icons do). React renders that content in place as the location, its state or the function changes, with the provider's context, keeping its state; a popup's `popupOpen` waits until it is in, and the content unmounts when the popup closes. Returning nothing (`null`, `undefined`, a boolean) leaves the location's own `content` or `icon`, decided each time the map asks for it: on drawing, on a state change, on opening. Whether either is given is read on mount. `<LocationList>` takes the list view's options (a change builds it again), for a listbox a function rendering each entry's content as React content, and `position`, a corner: inside a `<MaplaceMap>` the list itself goes on the map there through `mountControl` while the map is attached, as the element's `list-position` (so its panel hides with it and its entries scroll under its heading); without a `<MaplaceMap>` it is misuse. `<MapControl position>`, inside a `<MaplaceMap>`, puts its children on the map in that corner through the adapter's `mountControl`, while the map is attached, keeping the provider's context, for the page's own content, shown as given; outside a `<MaplaceMap>` it is misuse, and on a server it renders nothing. `useMaplace()` returns the store (`useSyncExternalStore(store.subscribe, store.getSnapshot)` reads its state). Misuse throws from render or a layout effect, to the nearest error boundary. Nothing touches the DOM on import or on a server render. The entry starts with `"use client"`, so in React Server Components it is a client boundary: a server component renders `<MaplaceProvider>` and `<LocationList>` with data (`locations`, `defaultSelectedId`, `filter`, `route`, the list's options), while what takes a function (`<MaplaceMap>`'s `createAdapter`, `on<Event>` props, `popupContent`, `markerIcon`, a list's `children`) goes in the app's own client component, as does a controlled `selectedId`, which needs its `onSelectionChange`.

### Loading, providers and packaging

- **One package, separate entries**: `maplace` (store, list view, adapter contract), `maplace/google`, `maplace/maplibre`, `maplace/element`, `maplace/element/google`, `maplace/element/maplibre`, `maplace/react`. One version for all. `react` and `react-dom` (19) and `maplibre-gl` are optional peers. `@googlemaps/markerclusterer` is a dependency, loaded only by a store that clusters: as an optional peer, the bundlers of pages that never cluster would fail on its import. The CDN gets three scripts: on Google, `maplace-element.iife.js` and `maplace-element-cluster.iife.js` (clustering bundled, nothing fetched from other origins at runtime, the bundled packages' licences in `THIRD-PARTY-LICENSES.txt` beside it), a map with `cluster` on the first failing to load (`provider-load-failed`, naming the second); and `maplace-element-maplibre.iife.js`, the element on MapLibre with maplibre-gl, its worker and its stylesheet bundled, so one pinned file is all a page loads (nothing fetched from other origins at runtime but the map's style and tiles; the worker started from a `blob:` URL, so a page's CSP allows `worker-src blob:`; clustering included, as in the clustered Google script, its packages' licences with the others). None sets a global: the element is the API. The MapLibre script is about 1.8 MB (491 kB gzip) and its source map, linked without the sources' content, about 1.6 MB: both are in `dist`, so the npm tarball grows by about 3.4 MB, as the CDN does. On npm, `sideEffects` lists the element entries, which define the elements on import (so they are for pages, not server components); everything else is side-effect-free. The package is ES modules only, with no CommonJS build: CommonJS code loads it with `import()`. Evergreen browsers only (ES2022): no transpiling for old browsers keeps the builds small.
- **One copy per page**: defining the elements is idempotent. A second, different copy of maplace logs an error and leaves the first in place; providers registered by the second copy are not seen, so its maps report an unknown `provider` (`invalid-input`).
- **Loading Google Maps**: nothing reads `google` at import time; the adapter calls the global `google.maps.importLibrary`, which works with Google's bootstrap snippet and with js-api-loader, so there is no loader dependency. Only the element's Google provider adds Maps JS itself, from `api-key`, `version`, `language`, `region` and `nonce` (for CSP), with `map-id` optional; `color-scheme` and `map-options` (a JSON object) are `colorScheme` and `mapOptions` for the map it creates, with the same exclusions, read when the map opens and opening it again when changed, since Google sets a colour scheme only on a new map (a bad value is `invalid-input` naming the attribute, `map-options.center`; each re-open is a new map load, which Google bills). One script per page however many maps, never added while the element is held. The page's Maps JS tag, whoever added it, is shared: an element asking it for another `api-key`, `version`, `language` or `region` is misuse (one it leaves out takes the page's; `nonce` is never compared), and `api-key` is needed only to add the tag (Google never reports a missing key). A page that loaded Maps JS with no tag of its own (Google's bootstrap, js-api-loader) is taken as it is, its loader attributes unchecked. A tag that fails to load is `provider-load-failed`. Without `google.maps.importLibrary` (an old or missing Maps JS) loading fails with `provider-load-failed`.
- **Google markers and styling**: advanced markers only, the legacy `Marker` being deprecated, so a map has a map ID: the page's, or, when it gives none, Google's public `DEMO_MAP_ID`, for development, a map maplace creates on it warning once per page in the console that it isn't for production. Styling is the map ID's Cloud styling plus `colorScheme` (the element's `color-scheme`); JSON `styles` are not offered because Google ignores them on maps with a map ID. What goes on a Google map (`mountControl`, so `list-position`, `<LocationList position>`, `<MapControl>` and a defined view) sits in a panel like Google's controls (background, text colour, shadow, rounding, margin), at 13px whatever the map inherits, its form controls at that size, maplace's own lists scrolling within the height of a map maplace creates (the panel clips nothing, so a page's control can draw outside it), in the map's `colorScheme`, never the page's (light on the page's own map: `.maplace-control { color-scheme: dark }` matches a dark one); an adopted stylesheet with every selector in `:where()`, so a page's rule on `.maplace-control` wins.
- **Routes**: Google's Routes library; it needs Maps JS 3.63 or later, else `route-failed`. Stops: 2 to `routeStopLimit` of your own locations (27 on Google), each still an ordinary, selectable location; `via` names inner stops the route passes through without ending a leg (Google's via waypoints; 0.2's `stopover: false`): the legs run between the other stops, and every stop counts toward `routeStopLimit`. Removing a stop's location drops it, and from `via` any id no longer an inner stop; below two stops the route clears. A route is computed at most once per task, and only when stops, `via`, their positions or the travel mode change (after a drag, only when it ends), because each computation is billed; `setRoute` with an equal route (same stops in order, the same stops passed through, travel mode and style) changes nothing and keeps the old reference; a change of `style` alone redraws the line without recomputing. Each leg has its `steps`, the provider's turn-by-turn directions (an `instruction`, in the language Maps JS loaded with, `undefined` where it gives none, and the step's distance and duration without traffic), so a page renders its own directions; on Google they come with the legs, at no extra cost.
- **Clustering**: `cluster: true` groups markers only; circles, lines and polygons are never clustered. A hidden location is in no cluster, and the selected one is drawn on its own, so a selection from the list reaches it and its popup points at it. A click on a cluster, or Enter on it, zooms into it (a move of the user's). On Google, `@googlemaps/markerclusterer` with maplace's own cluster markers (a count, titled "Cluster of N locations"), loaded with the map: `whenReady` waits for it, and a failed load is `provider-load-failed`.
- **Loading MapLibre**: `maplibre-gl` is the page's to install, an optional peer, loaded when a MapLibre map mounts (a page that never mounts one never loads it); missing, or the browser giving no WebGL, the load fails with `provider-load-failed`. The page imports its stylesheet (`maplibre-gl/dist/maplibre-gl.css`), as every MapLibre page does, in step with the version it installed; without it markers and popups are misplaced, and maplace warns once per document in the console. A style that fails to load is `provider-load-failed`, or `provider-auth-failed` when its server refuses it (HTTP 401 or 403: a key missing or wrong in its URL); a tile or sprite failing later is MapLibre's to log. MapLibre's zoom is on 512-pixel tiles: the adapter speaks maplace's, one more. A marker with no icon is a pin like Google's default one, drawn in a layer of the map rather than the DOM, so thousands stay fast (§3 Performance), unchanged when selected, as Google's is, though drawn in front of the rest while selected or hovered; reached by keyboard through the list, as shapes are on Google. A marker with an icon is a DOM marker, focusable and pressed by Enter or Space. Polylines and polygons are drawn in layers too, every polygon's outline above every fill (a click still finds the smaller shape first). A popup opened by a click pans the map to show it and takes focus when the map held it, as Google's does; a hover's popup does neither. Routes are Google's only: MapLibre has no routing, and `route` is not among its capabilities. What goes on a MapLibre map (`mountControl`, so `createMapLibreMap`'s `list`, `<LocationList position>` and `<MapControl>`) sits in a panel like MapLibre's own controls (background, rounding, ring, its corners' margins), at 13px whatever the map inherits, its form controls at that size, maplace's own lists scrolling within the height of a map maplace creates (in the bottom-right corner, clear of one line of MapLibre's attribution); light, as MapLibre's controls are (`.maplace-control { color-scheme: dark }` gives a dark one); every selector in `:where()`, the same `.maplace-control` as on Google. The element's `maplibre` provider (`maplace/element/maplibre`, or the MapLibre CDN script) reads `map-style` (a style URL, or a JSON style object) as `mapStyle` and `map-options` (a JSON object) as `mapOptions`, with the same exclusions; a bad value is `invalid-input` naming the attribute (`map-options.center`; `map-options.style` is told it is `map-style`). Both are read when the map opens, and a change opens it again where it was. `color-scheme` isn't read: the style sets the colours. A CDN page needs nothing besides the script, and a content security policy that allows its worker (`worker-src blob:`).
- **Ready for other providers**: no provider type appears outside the provider's entry; the store speaks its own `LatLng`, `Bounds`, zoom scale and DOM-node content, and what differs between providers is a capability. MapLibre's adapter is new code behind the same contract, not a change to it.

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
  | `invalid-input` | Bad data or arguments: `lon` instead of `lng`, a circle without a radius, coordinates out of range (or given as strings), a polyline under 2 points or a polygon or hole under 3, a fill on a polyline, an unknown field (0.2 names get their 1.0 replacement; your own fields go in `data`), both `content` and `html`, a box with south above north, `zoom` with `pan: false`, selecting or hovering a hidden location, `render` with `as: 'select'`, fewer than two or more than `routeStopLimit` route stops, a route `via` id that isn't one of its inner stops, element setup per §3 Loading, an unknown or ambiguous element `provider`, an unknown, built-in or taken list view name, a container that doesn't hold the map the adapter draws on (`pageMapElement`) |
  | `duplicate-id` | Two locations with one id |
  | `unknown-id` | An id not in the store (`select`, `hover`, `selectedId`, a route stop); checked before the stop count |
  | `missing-sanitizer` | `html` without `sanitize` |
  | `unsupported-capability` | A feature the adapter lacks |
  | `already-attached` | A store attached twice, or an adapter instance reused |
  | `destroyed` | A call after `destroy` that changes state or adds a listener; `getSnapshot`, a second `destroy` and unsubscribe functions stay safe |
- **Runtime failures are events**, never throws: `provider-load-failed`, `provider-auth-failed`, `route-failed`. For the first two, `loadState` becomes `error` and `whenReady()` rejects; one that comes after `ready` (Google refuses a key once its first map shows) moves `loadState` from `ready` to `error`, and later `whenReady()` calls reject.
- **Your own code failing while the map draws**: an `icon` or `content` function, or `sanitize`, that throws or returns something other than a Node is an `invalid-input` error event naming the location and field, with what was thrown as `cause`, once until that `icon`, `content` or `html` changes. The map stays ready and draws the default marker, or opens no popup. The store catches it, so every adapter behaves alike. React content from `<MaplaceMap>`'s `popupContent` or `markerIcon` that throws, the function or a component under it, is the same error event (field `popupContent` or `markerIcon`), once until the location or the function changes; that content renders nothing.
- **When capabilities are checked**: before `attach` the store skips capability checks (other misuse still throws); `attach` checks the current state against the adapter and throws; afterwards each call checks before changing anything. The adapter's `routeStopLimit` is checked the same way. Applying changes to the map never throws.
- **In the element**, where no caller can catch a throw, misuse sets the error state and dispatches `maplace-error`. Nothing fails silently. The error state stands until the misuse is corrected: bad locations or a bad route keep the previous ones until valid ones are given, a `selected-id` the locations don't have stands until they do (then it is selected) or something else is selected, and a missing or failing provider is tried again on the element's next attribute change or when a provider is registered; a list naming a view not yet defined is built once it is.

### Decisions from the 0.2 issues

| Need (issues) | Decision |
|---|---|
| Categories and filters (#15, #36, #40, #44, #85, #87, #117, #143) | `group` on a location, `setFilter(groups)` on the store; the list shows group headings |
| Saving dragged or edited shapes (#48, #49, #64, #107, #155, #164, #178) | The store writes the new geometry back and fires `locationChange`; pages save from the event; `locationEdit` reports the geometry while the drag is under way, for a live readout |
| Map container sizing and styles (#23, #184) | Nothing maplace draws carries inline styles; default styles (the element's layout, the list's buttons, popup content's dark text on Google's white bubble, a Google map's control panel) are adopted stylesheets with every selector in `:where()`, so pages override them, and `data-maplace-unstyled` on any ancestor turns them off inside it (as 0.2's `controls_applycss: false`), but for what maplace's own markup needs (a `<maplace-location>` hidden, the element a block and its pane filling it, an on-map panel whose list is hidden hidden too); the classes maplace's markup carries are documented to style it by ([Styling](reference/styling.md)); the element is 24rem tall unless the page sets its height, and a list beside the map goes under it on a screen narrower than 40rem, within that height (at most 40% of it, scrolling) |
| Popup width and offset (#86, #160, #198) | `popup: { maxWidth, offset }` |
| Open on hover (#197) | `popup: { openOn: 'hover' }`; default `click` |
| Different icon when selected (#192) | An `icon` (an image URL, a node or a function), in HTML `<maplace-location icon>` or a `<template data-icon>` child; DOM markers carry `data-selected` / `data-hovered` while in that state, for CSS; an `icon` function receives `(location, LocationState)` and re-runs only when the state changes; shapes are drawn heavier when selected or hovered (stroke width and opacity, fill opacity), wherever their style leaves those unset; their own `selectedStyle` and `hoveredStyle` (and the store's) are drawn over that |
| Act on popup content once shown (#171) | `popupOpen` fires after the content is in the DOM, with the element |
| React to zoom and pan (#195) | `viewportChange` event after each move ends |
| A click on the map (#127) | `mapClick` with `{ position }` for a click on the map itself, not on a location, on the store, so the element (`maplace-mapclick`) and React (`onMapClick`) get it too; it still clears the selection |
| Large data sets (#3, #54, #95, #174, #182) | See Performance below |
| Hidden or resized containers (#1, #79, #83, #136, #154, #173) | The adapter watches the container's size: a view sent while it has none (a closed tab or dialog) waits, and no viewport is reported, until it is shown; once shown, and after each resize, the last view is shown again unless the user moved the map since (a fit stays fitted as a side panel opens; after a drag or zoom, a resize keeps what the user chose; only a move after the user's input on the map counts, so your own code moving your map doesn't stop the store's view coming back unless the user has used the map since its last view) |
| Silent grey map on bad input (#63, #125, #145, #149, #175) | Validation per the error rules above |
| Explicit centre overridden by fit (#18, #46) | An explicit `view` wins over `selectedId` and fit (see Shape) |
| Stacking order (#60) | Markers: the hovered one stacks on top, then the selected one, otherwise in the order they were added (a reorder alone doesn't restack). Shapes, below every marker: the smaller area in front, so a shape inside another stays reachable; a line before any area; the later added first among shapes of one size; hovering or selecting doesn't move one. No `zIndex` field |
| Shape colours (stroke and circle options in 0.2) | Neutral `style`, `selectedStyle` and `hoveredStyle` per shape, and the same three as store options; the store merges them, adapters map the result |

### Numbers

Checked by `npm run check` (`scripts/checks/sizes.ts`, which reads them from this table), measured on the builds `npm run build` makes (made in memory with the same options, ES2022, minified, each output gzipped):

| | Budget (gzip) |
|---|---|
| Core (`maplace`) | ≤ 16.5 kB |
| Google adapter (`maplace/google`) | ≤ 13.2 kB |
| MapLibre adapter (`maplace/maplibre`) | ≤ 16.5 kB |
| React binding (`maplace/react`) | ≤ 4.0 kB |
| Element CDN build (core + Google + list view + element) | ≤ 32.0 kB |
| Element CDN build with clustering | ≤ 40.7 kB |
| Element CDN build on MapLibre (core + MapLibre + list view + element) | ≤ 34.5 kB |
| Element CDN build on MapLibre, as served (maplibre-gl, its worker and stylesheet bundled) | ≤ 540 kB |

Each budget is what 1.0 measured, plus about 10% (2026-10-16, ES2020, from source: 14.7, 9.2, 27.6 and 36.6 kB; on the ES2022 builds: 14.8, 9.3, 27.0 and 35.6 kB; the React binding, 2026-10-17: 1.8 kB, then 3.6 kB with React content in popups and markers, then 4.0 kB, 2026-10-21, once the default styles could be turned off, V19, measured 3.902 kB against 3.9: the core's shared code moving between chunks, nothing the binding added; the element CDN build, 2026-10-18: 30.5 kB, then 31 kB once the element gained its own API from the 0.2 gap analysis: shape styles, a location's zoom and listing, map settings that re-open the map, list views registered by name, a list heading; the Google adapter, 2026-10-19: 10.1 kB, then 10.6 kB once what goes on a Google map got a panel like Google's own controls, V17, then 11.2 kB with `createGoogleMap`, A9, measured 11.19 kB: the shortcut and its options' checks, and the core's code it shares with the adapter now counted in the core's one chunk, which a page loads whole; then 11.3 kB once the map ID was optional, G15, measured 11.28 kB, most of it the warning a map on Google's demo map ID prints; then 11.7 kB once shapes stacked by size, G16, measured 11.60 kB: a shape's area on the sphere, its rank from it, and the `zIndex` hint saying so; then 11.8 kB once a popup was headed by its location's title, G17, measured 11.77 kB: the heading element, kept current, and the content's insets; then 11.9 kB once the default styles could be turned off, V19, measured 11.82 kB: the opt-out's guard on each popup and panel rule, the popup sheet's selectors named; then 13.2 kB once what both adapters need was shared with MapLibre's, M1, measured 13.10 kB: the shortcut, the popup session, the view follower and the click gesture made provider-neutral (their interfaces' names kept by the minifier), and the code both adapters load served in chunks of its own, each gzipped apart; the element CDN build, 2026-10-19: 31.2 kB once `attach` took a selector and the 0.2 hints named `createGoogleMap`, A9, measured 31.12 kB, then 31.4 kB with G16, measured 31.38 kB, then 31.6 kB once a popup was headed by its location's title and its content got the bubble's inset on every side, G17, measured 31.57 kB, then 31.7 kB once the default styles could be turned off, V19, measured 31.65 kB: the guard on every default rule, and the list view's own class; then 32.0 kB, and 40.7 kB with clustering, with the Google code shared with MapLibre's, M1, measured 31.91 and 40.65 kB; the MapLibre adapter, 2026-10-21: 13.9 kB, M1, measured 12.64 kB: the map, its markers, shapes, popups and camera; then, 2026-10-22, with on-map controls in a panel like MapLibre's own, M4, measured 13.36 kB; then 16.5 kB once circles and editing were drawn, M2, measured 14.99 kB: the circle's ring on the sphere and the edit handles; the element CDN build on MapLibre, 2026-10-22: 34.5 kB of maplace's own code (M6, measured 31.50 kB), and the script as served, maplibre-gl 6.15.0 with its worker and stylesheet bundled, 540 kB (measured 491.19 kB)). The core, the Google adapter and the React binding are measured as they ship, sharing chunks, each chunk gzipped as it is served; the Google adapter and the React binding count what they add to a page already using the core (React itself is the page's); the CDN builds are the three script files, the MapLibre one measured twice: maplace's own code (the script built with every package left out), and as served. The first budgets (4, 10, 15 and 25 kB) were set before the code: the store's own state, sync and diffing alone are over 4 kB, and the rest is the API itself, its validation with messages naming the location and field, the 0.2 hints and the two list variants, none of which 1.0 drops to fit a number.

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
- Default markers (no `icon`) may be drawn without DOM; the MapLibre adapter uses a GPU layer. Custom icons are DOM on every provider. Measured when built (M1, Chromium 153 on an Apple M1 Max's GPU): 4,000 and 8,000 default markers idle within 0.4 s of loading, with no task over 50 ms, 56–60 fps panning, and a selection painted within 30 ms. The selected or hovered pin is drawn again in the DOM above the layer, showing only (the layer under it takes the pointer): changing the layer lays every pin out again, 80 ms for 4,000 even in software WebGL.
- Adapters draw large diffs in chunks so no task exceeds 200 ms. The one exception allowed: if clustering can't be split, its single clustering pass at load (210 ms at 4,000, 395 ms at 8,000) is accepted. Measured when built (G7, Maps JS 3.66, headless Chromium): Google clusters each drawn diff in one pass, the longest task 61 ms when 4,000 load; a selection or filter clusters again, 66–76 ms at 4,000.

## 4. Migrating from 0.2

Moved to [MIGRATION.md](../MIGRATION.md): every 0.2 option, location field, method and callback, with what 1.0 does with it.

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
| Native map options and escape hatch | 2, 4, 7, 29, 58, 62, 97, 166 | 27 (8+0+19) | `mapOptions` (the element's `map-options`) or your own map; Cloud styling (§3 Shape, Loading) |
| Hidden or resized container rendering | 1, 79, 83, 136, 154, 173 | 26 (6+0+20) | adapters watch the container (§3 Decisions) |
| Groups, categories, filters, layer toggles | 15, 36, 40, 44, 85, 87, 117, 143 | 26 (8+0+18) | `group` and `setFilter`, list group headings (§3 Decisions) |
| Packaging, distribution, jQuery dependency | 26, 30, 50, 71, 82, 104, 112, 113, 116, 118, 119, 162, 185 | 23 (13+0+10) | one package, ES modules and CDN scripts, no jQuery (§3 Loading) |
| Route result data, events, waypoint limits | 121, 129, 139, 142, 147, 176 | 19 (6+0+13) | `routeChange` event with legs and their steps; stop limit from the adapter (§3 Loading) |
| Events and callbacks API | 32, 53, 80, 110, 111, 127, 137, 141, 194, 195 | 19 (10+0+9) | one typed event system (§3 Shape) |
| Docs, website, examples | 17, 34, 134, 140, 157, 181, 189, 196 | 18 (8+2+8) | new site with runnable examples (§2) |
| Overlay layers (KML, traffic, bicycling, Data/GeoJSON) | 28, 38, 61, 68, 81, 103, 188 | 16 (7+0+9) | out of scope: add them to your own map (§1 Non-goals) |
| Single location renders blank map | 52, 55, 65 | 15 (3+0+12) | the initial-view order; kept as a regression test |
| List view and programmatic select | 5, 75, 84, 115, 122 | 14 (5+0+9) | list view and `select` (§3 Shape) |
| Mixed location types on one map | 10, 43, 90, 158, 179, 193 | 13 (6+0+7) | `type` per location (§3 Shape) |
| Geocoding and address input | 8, 24, 126, 131, 170 | 13 (5+0+8) | later: locations from addresses (§1) |
| Setup errors and input validation | 63, 125, 145, 175 | 13 (4+0+9) | misuse throws with code, id and field (§3 Errors) |
| Places and location search (search box, place details, save a place) | 41, 98, 152, 165 | 12 (4+0+8) | later: Places integration (§1) |
| Editable/draggable geometry sync | 48, 49, 64, 107, 155, 164, 178 | 11 (7+0+4) | `editable`, written back, `locationChange` event (§3 Decisions) |
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
| Editable markers and shapes write geometry back and emit a typed `locationChange` | 48, 49, 64, 107, 155, 164, 178 | §3 Decisions |
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
| 194 | issue | fixed by 1.0 | Typed `selectionChange` events (§3 Shape) |
| 195 | issue | fixed by 1.0 | `viewportChange` event (§3 Decisions) |
| 197 | issue | fixed by 1.0 | `openOn: 'hover'` (§3 Decisions) |
| 198 | issue | fixed by 1.0 | Popup `offset` (§3 Decisions) |
