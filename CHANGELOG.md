# Changelog

One dated line per change a reader would notice, newest first, written in the commit that makes it (1.0.0, a rewrite, is summarised in one entry instead); an issue the change closes is named as `#N` at the line's end. Lines above the first version heading are unreleased: the next release lists them under its own heading and turns them into its release notes.

- 2026-11-13 Added `curve` on a polyline: each segment drawn as an arc, the same on Google and MapLibre, for flights and lanes between places

## 1.0.2 (2026-11-09)

- 2026-11-09 Fixed `whenReady()` and `loadState` `ready` on MapLibre (and its adapter's `apply`) resolving before the locations were drawn when MapLibre was slow to load them (its workers starting, a busy machine): they now wait for the load, up to 10 s, and give only the drawing its 1 s cap, so a click or a hover right after finds what was added

## 1.0.1 (2026-11-08)

- 2026-11-08 Changed the MapLibre CDN script to bundle maplibre-gl 6.16.0, and `Maplace.maplibre` with it
- 2026-11-08 Fixed MapLibre maps on maplibre-gl 6.16 and later saying nothing when its worker can't start (a page opened as a file, a content security policy without `worker-src`): the map fails with `provider-load-failed` again
- 2026-11-08 Fixed tools that read only `package.json`'s top-level `types` field, such as npm's types badge, finding no TypeScript types: the field now names the core entry's declarations

## 1.0.0 (2026-11-07)

- 2026-11-07 Changed everything: Maplace.js 1.0 is a rewrite with no jQuery. A list of locations becomes a map with a list kept in sync beside it, on Google Maps or MapLibre, from HTML, a page's own script, a bundler or React; see [the README](README.md), [MIGRATION.md](MIGRATION.md) for moving a 0.2 page, and [the 1.0 RFC](docs/rfc-1.0.md)
- 2026-11-07 Changed the npm package's name to `@maplacejs/maplace` (0.2 was `maplace-js`)
- 2026-11-07 Changed the licence from MIT to Apache-2.0
- 2026-11-07 Changed what Maplace.js needs: evergreen browsers (ES2022) and ES modules only, with no CommonJS build; React 19 for `@maplacejs/maplace/react`, and `maplibre-gl` installed beside `@maplacejs/maplace/maplibre`, both optional peers
- 2026-11-07 Removed 0.2's API: `new Maplace(options).Load()`, its options and its callbacks each have a 1.0 replacement, named in [MIGRATION.md](MIGRATION.md)
- 2026-11-07 Added a headless store, `createMaplace`, holding the locations, the selection, hover, a filter, a route and the view, with an event for each change, drawn on a map by a provider's adapter
- 2026-11-07 Added `<maplace-map>` and `<maplace-location>` (`@maplacejs/maplace/element`): a map, its list and its locations written in HTML, with `maplace-*` DOM events, and template types for Vue and Svelte
- 2026-11-07 Added three CDN scripts and no build step: Google's, Google's with clustering, and MapLibre's with maplibre-gl bundled, each pinnable with an integrity hash and setting a `Maplace` global for a page's own script
- 2026-11-07 Added `@maplacejs/maplace/google`: Google Maps through its current libraries (advanced markers, map IDs, Routes), `createGoogleMap` as 0.2's one call, and Maps JS added to the page by Maplace.js itself given `apiKey`
- 2026-11-07 Added `@maplacejs/maplace/maplibre`: MapLibre GL JS on OpenFreeMap's tiles or any style, with no key, drawing everything Google does but routes
- 2026-11-07 Added `@maplacejs/maplace/react`: `<MaplaceProvider>`, `<MaplaceMap>`, `<LocationList>`, `<MapControl>`, `<MyLocation>` and `useMaplace()`, popups and markers as React content, ready for Server Components
- 2026-11-07 Added HTML popups made safe: `content` as text or a node of yours, and `html` passed through your sanitizer (`sanitize`), never written to the page as it came
- 2026-11-07 Added support for a strict Content Security Policy: no inline styles (default styles are adopted stylesheets), a `nonce` for the Maps JS script Maplace.js adds, and the MapLibre script's worker started from a `blob:` URL
- 2026-11-07 Added the map's look per provider: on Google a map ID, a light, dark or system colour scheme and Google's map options (`color-scheme`, `map-options`); on MapLibre any style URL or style object (`map-style`)
- 2026-11-07 Added drawing on a map of your own: hand Maplace.js an existing Google or MapLibre map and it adds its markers, shapes and list without moving or removing your map
- 2026-11-07 Added markers (the provider's pin, an image or your own HTML), circles, polylines and polygons, each selectable and hoverable with styles of its own for both, and editable by dragging, the edit reported as it happens
- 2026-11-07 Added clustering on both providers (`cluster`), keeping thousands of points fast
- 2026-11-07 Added routes on Google: a drive through your locations, passing through via points, avoiding tolls, highways or ferries, with turn-by-turn steps for each leg
- 2026-11-07 Added the list view, in sync with the map either way: grouped, as a list or a native select, with a "fit all" entry, a heading and group counts, or a list view of your own through `defineListView`
- 2026-11-07 Added `mapClick`, a click on the map itself with its position, for a page adding a place where the visitor clicks, as 0.2's `listeners` allowed; and `listed: false`, a location on the map but in no list, as 0.2's `on_menu: false`
- 2026-11-07 Added search and filters: a search box over the list, `setFilter({ query, groups, tags })`, and a location's `tags` and `searchText`
- 2026-11-07 Added a list that follows the map: "This area" lists only what is in view, following the map as it moves
- 2026-11-07 Added "My location": the visitor's position asked for only on a press, and the list sorted by distance from it or from any point
- 2026-11-07 Added an Open in Maps link and a directions link at the end of a popup
- 2026-11-07 Added accessibility throughout: the list and the markers usable by keyboard, a link to skip the map, each selection announced and focus kept where it was; the site's accessibility statement says what was tested
- 2026-11-07 Added default styles that any rule of your page wins over, classes and custom properties to style by, and `data-maplace-unstyled` to turn the defaults off
- 2026-11-07 Added consent-friendly loading: `hold`, with a ready-made "Load map" panel naming the provider, and `loading="lazy"`, so nothing reaches the provider until the visitor allows it or scrolls to the map
- 2026-11-07 Added `url-state`: the selection kept in the page's address, a link to share, back and forward stepping through it
- 2026-11-07 Added the map's first view from HTML: `center` and `zoom`, `selected-id`, or a location's own `zoom`
- 2026-11-07 Added `locationsFromGeoJSON`, turning a GeoJSON FeatureCollection's points, lines and polygons into locations #188
- 2026-11-07 Added a recipe for addresses: a short Node script that geocodes a file of places once, before the page ships #174
- 2026-11-07 Added maps that cope with real pages: a map in a closed tab or a hidden panel, or resized, shows its view again when it comes back, and a page with many maps doesn't run out of WebGL contexts
- 2026-11-07 Added TypeScript types for the whole API, and errors with a code and the field at fault for every misuse
- 2026-11-07 Added `@maplacejs/maplace/testing`: the conformance suite Maplace.js's own adapters pass, for proving an adapter of your own
- 2026-11-07 Added a new site at maplacejs.com: 25 examples, each run live as HTML, Script, Bundler and React on both providers; a reference page for each part of the API; a snippet builder taking CSV, JSON, GeoJSON or a 0.2 config; and the docs in Markdown with an agent skill for AI tools
- 2026-11-07 Added contributing rules, a security policy, a code of conduct and forms for bug reports and feature requests

## 0.2.10 (2017-04-02)

- 2017-04-02 Fixed `afterRoute` not passing the status or location of a dragged route #147 #139
- 2017-04-02 Added a listener for `insert_at` polygon events #164

## 0.2.9 (2017-03-26)

- 2017-03-26 Fixed `afterCloseInfowindow` not firing after a close #137
- 2017-03-26 Changed every event function to run with the current Maplace instance as `this`

## 0.2.8 (2017-03-26)

- 2017-03-26 Fixed controls duplicated by `SetLocations` #161
- 2017-03-26 Fixed setting the info windows' `maxWidth` #160

## 0.2.7 (2016-03-12)

- 2016-03-12 Fixed 0.2.6 not loading maps #132
- 2016-03-12 Fixed the documented listener example #127

## 0.2.0 (2015-12-21)

- 2015-12-21 Changed to jQuery ~2.1
- 2015-12-21 Changed the build's output directory from `src` to `dist`, built with Grunt
- 2015-12-21 Changed the in-map menu's default border colour to match Google Maps' new UI

## 0.1.3 (2014-07-12)

- 2014-07-12 Added circles, mixed with markers
- 2014-07-12 Removed the `hide_marker` option, for consistency with `visible`
- 2014-07-12 Added the map's initial centre and zoom
- 2014-07-12 Fixed editable polylines and polygons with visible markers
- 2014-07-12 Added drag events for markers, circles, polylines and polygons
- 2014-07-12 Changed public functions to return `this`, for chaining
- 2014-07-12 Changed the `commons` option to `shared`, which each location's own options override
- 2014-07-12 Changed the debug output

## 0.1.2 (2014-01-07)

- 2014-01-07 Fixed several bugs

## 0.1.0 (2013-02-22)

- 2013-02-22 Added Maplace.js: Google Maps locations with a menu, from a list
