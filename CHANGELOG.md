# Changelog

One dated line per change a reader would notice, newest first, written in the commit that makes it; an issue the change closes is named as `#N` at the line's end. Lines above the first version heading are unreleased: the next release lists them under its own heading and turns them into its release notes.

- 2026-10-28 Changed the markers example, in every version on both providers: Venice's star is a gold disc styled by the page's own CSS (`.star`), a first look at markers of your own
- 2026-10-28 Fixed Google's markers drawn over an open popup in Safari: the popup's pane gets a compositing layer of its own (`will-change: transform`), given back as it was when maplace lets go of a page's own map
- 2026-10-28 Fixed a MapLibre popup covering its marker when the marker's icon grows after the popup opens, as an image icon does while it loads: the popup moves up with it
- 2026-10-27 Added three examples on styling: `css-markers` (pins drawn by your CSS, keyed on `data-hovered` and `data-selected`), `brand` (one palette across shapes, the cluster badge and the list) and `unstyled` (`data-maplace-unstyled`, the page's CSS doing it all); `styled` chooses among four MapLibre styles and three Google schemes
- 2026-10-27 Fixed clusters on Google staying drawn when a clustered location moved and every clustered location was removed, hidden or selected in the same change
- 2026-10-27 Changed hidden maps to keep their WebGL context while the page's maps hold 8 or fewer, so a map in a closed tab or a hidden panel shows again at once instead of drawing from scratch; past 8, the map hidden longest gives its context back first, as before (MapLibre, and Google's vector maps)
- 2026-10-27 Fixed clustering on Google throwing `TypeError`s ("reading 'range'") when a clustered map drew before it had any locations, as one does while its data loads
- 2026-10-27 Added a list that follows the map: `scope: "viewport"` shows a switch above the list, "All" or "This area", the second listing the locations in the map's view and following it as the map moves, wherever the list is (on the map, beside or under it, in a container of the page's), with a status, announced, over an empty area (`list-scope`, `area-only-label`, `show-all-label` and `empty-area-label` on `<maplace-map>`; `scope`, `areaOnlyLabel`, `showAllLabel` and `emptyAreaLabel` on `createListView` and `<LocationList>`), live in the Cluster example; a list on the map at least 12em wide; the Store, React, Element and Styling reference pages
- 2026-10-27 Added `url-state` on `<maplace-map>`: the selection in the page's address (`?location=<id>`, or the parameter it names), selected on load, a history entry per selection so back and forward step through them; documented in the element reference's Map attributes and URL state
- 2026-10-27 Added `avoid` to a route, `"tolls"`, `"highways"` and `"ferries"` in any order (0.2's `directions_options.avoidTolls` and `avoidHighways`), passed to Google's Routes library on driving routes; the store reference's Routes, Google's Routes and the migration guide say how
- 2026-10-27 Added `loading="lazy"` on `<maplace-map>`: the map loads its provider only as it comes within 100px of the viewport, so a map below the fold costs no map load until seen; its list is built at once, and `release()` loads it at once (the Element and Setup pages)
- 2026-10-27 Added a recipe for addresses: a short Node script that geocodes a file of places once, before the page ships (OpenCage by default, swappable), and which geocoders let you keep the results; in Locations' Addresses to coordinates section #24 #126 #170 #174
- 2026-10-27 Added `locationsFromGeoJSON`, turning a GeoJSON FeatureCollection's Points, LineStrings and Polygons into locations (ids from the features', title, group and data from their properties; Multi* geometries and features without an id refused), with its types `GeoJSONFeatureCollection` and `GeoJSONFeature`; documented in Locations' From GeoJSON section, the API page, the README and MIGRATION #188
- 2026-10-26 Fixed a cluster on Google losing keyboard focus, and every cluster drawn again, on a pan past what was clustered: a cluster's marker is now kept while the cluster stays where it was, as on MapLibre
- 2026-10-26 Added the cluster badge's class, `maplace-cluster`, and its colours as custom properties, `--maplace-cluster-background` and `--maplace-cluster-color`, on both providers: its look is a default style now, which any rule of the page overrides and `data-maplace-unstyled` turns off
- 2026-10-26 Fixed Google's clustering slowing at every zoom step into clusters: every location split from a cluster went on the map as a marker, off screen too (4,000 on big at zoom 10); only those in the view and half a view around it do now, as on MapLibre, and a short pan draws nothing again
- 2026-10-26 Fixed a touch on a marker hovering it: with `openOn: "hover"` a tap flashed the popup open and shut, and on MapLibre an editable marker whose page icon follows hover, the page answering the hover at once, couldn't be dragged by a finger (its icon rebuilt under it before the drag began); a touch now hovers no list entry and no DOM marker (every Google marker, and MapLibre's with an icon or `editable`), and lets go of what the pointer hovered before
- 2026-10-26 Fixed the nonce of the Maps JS script `<maplace-map>` adds when the nonce is set as the element's `nonce` property, as Vue and Svelte set it, or when a Content Security Policy sent as a header hides the attribute: the script went in without one; the element now reads the property, which holds the attribute's value too
- 2026-10-26 Fixed `list="true"`, as Svelte 5 writes a bare `list`, refused as naming no list view: it is now the built-in list, as `list=""` is, and `defineListView("true", …)` is refused as a built-in name
- 2026-10-26 Added Vue and Svelte template types for `<maplace-map>` and `<maplace-location>` in `maplace/element`: their attributes, `locations`, `route`, `sanitize`, `maplace-*` and DOM events, in Vue's `GlobalComponents` (a template ref typed as the element) and Svelte's `svelte/elements`, loaded only by a project using either; `vue` (3.3 or later) and `svelte` (4 or 5) as optional peers; the element page's Vue and Svelte section
- 2026-10-26 Fixed an editable marker with its own icon on MapLibre whose icon the page rebuilt during a touch drag (its state changing): the drag never ended, no change was reported and the marker followed the next move on the map; it now follows the finger and ends where it lifts or the browser cancels the touch, reporting its change once
- 2026-10-25 Changed the size budget of `maplace/google` to 16.6 kB (was 15.7): Google's popup pan, hidden maps giving back their WebGL context and drags ended by a window losing focus
- 2026-10-25 Fixed a Google popup opened from the list or by a click, on a narrow map, left under the list or another control in a corner: once Google's own pan ends, the map pans it clear of what the corners show, as on MapLibre, never over Google's logo or terms; with no room for that, Google's own pan stands
- 2026-10-25 Fixed Google maps keeping their WebGL contexts while hidden, which could blank another map on a page with many: a vector map maplace creates gives its context back while hidden, draws again once shown, and gives it back once destroyed
- 2026-10-25 Fixed a Google marker dragged when the window loses focus: its drag ends where it was, its locationChange reported there; before, it followed the pointer until the next release, wherever it came
- 2026-10-25 Fixed a Google shape's handle dragged when the window loses focus: the drag is cut short, nothing reported and the shape left where the store has it; before, it reported wherever the mouse was next let go
- 2026-10-25 Fixed a Google marker whose `editable` the page turns off mid-drag: drawn back where the store has it; before, it stayed where the drag had got to
- 2026-10-25 Fixed a MapLibre edit handle on another world copy moved again at every write-back
- 2026-10-24 Fixed MapLibre maps going blank on a page with many maps (the browser keeps about 16 WebGL contexts and takes the oldest away): a map maplace creates gives its context back while hidden, and draws again once shown
- 2026-10-24 Fixed Google's popup inset and margins reaching MapLibre's popups, and MapLibre's popup heading rule reaching Google's, on a page loading both providers
- 2026-10-24 Fixed a list view shown in a frame without its styles: in a map's panel, inside `<MapControl>`, as `<LocationList>`, in `<maplace-map>` and in a shortcut's `list.container`
- 2026-10-24 Fixed a MapLibre popup opened by a click or a selection ending under the map's corner controls (a location list on a phone): it pans clear of them once the map's own pan ends, never while the user holds the map, when there is room
- 2026-10-24 Fixed an editable marker with its own icon on MapLibre dragging on when the page turned its `editable` off mid-drag, its edits refused with errors on the console and the marker left where dropped: the drag is cut short, the marker back where the store has it, with no change reported
- 2026-10-24 Fixed an edit handle's or an editable marker's drag on MapLibre left hanging when the window lost focus with the button held or the browser cancelled the touch, the marker following the next move until the next release: the drag ends where it was and reports its change
- 2026-10-24 Fixed MapLibre's edit handles reporting a point dragged to −180 at 180: they report −180, as clicks and the viewport do
- 2026-10-23 Fixed MapLibre's control panels running into each other on a crowded map: a list stops short of what the corners below it hold, MapLibre's attribution included, lists sharing a side share its height, and a bottom-left panel sits above the attribution where they would meet (on a phone it covered the panel); on a page's own MapLibre map too
- 2026-10-23 Fixed a control's panel left unstyled on a map in a frame whose node the page made outside the frame (React's `MapControl` in `react-frame-component`), on Google and MapLibre: the panel's stylesheet goes to the map's document
- 2026-10-23 Fixed an edit handle or an editable marker let go outside a MapLibre map following the pointer back until the next click: the drag ends where it was let go and reports its change
- 2026-10-23 Fixed an editable marker on MapLibre lost, with no change reported, when a zoom folded it into a cluster mid-drag: it stays under the pointer until let go, then reports its change
- 2026-10-23 Fixed a circle's radius handle dropped on its centre on MapLibre leaving a radius of 0, which the store refused: it leaves a millimetre
- 2026-10-23 Fixed a circle round both poles on MapLibre drawn without them: it covers both
- 2026-10-23 Fixed MapLibre's pointer cursor and hover staying on a pin folded or hidden under a still pointer: once the map settles they follow what is under the pointer
- 2026-10-23 Fixed a shape's drag on MapLibre reporting no edits after an earlier drag that left the shape as it was
- 2026-10-23 Fixed a longitude already in −180..180 read back with float error (0.6 as 0.6000000000000227) in clicks and viewport reports
- 2026-10-23 Fixed maplace's layers staying on a page's own MapLibre map destroyed during a restyle that kept them (`transformStyle`)
- 2026-10-23 Fixed `<maplace-map>` reloading its map for a setting its provider doesn't read: a MapLibre map for `color-scheme`, a Google map for `map-style`
- 2026-10-23 Added `Maplace`, a global the CDN scripts set: what the npm entries `maplace`, the provider's and `maplace/element` export, so a page of its own script makes a map with `Maplace.createGoogleMap(...)` or `Maplace.createMapLibreMap(...)`, as 0.2's `new Maplace(...).Load()` did, with no build step; the MapLibre script's `Maplace.maplibre` is the maplibre-gl it bundles, for a map of the page's own
- 2026-10-23 Added a script version of every example (`script.html`): the map made from a page's own script on the CDN script's `Maplace`, with no build step; the site's code tabs are HTML, Script, Bundler (formerly Vanilla) and React
- 2026-10-23 Changed the MapLibre CDN script to run maplibre-gl as it loads, its worker and stylesheet with it, so `Maplace.maplibre` is ready for a page's own map: about 22 ms more on a page whose map hasn't opened yet
- 2026-10-23 Added Maps JS's settings to `createGoogleAdapter` and `createGoogleMap`: `apiKey`, `version`, `language`, `region` and `nonce`, as the element's attributes; given `apiKey`, maplacejs adds Maps JS to the page itself as the map mounts
- 2026-10-23 Removed `customElements.get("maplace-map").defineListView`: a page on the CDN script calls `Maplace.defineListView`
- 2026-10-22 Added the MapLibre adapter's reference page, and MapLibre throughout the docs: README's quick start, CDN scripts (the MapLibre one pinned for production), bundler and React sections, Setup's MapLibre path (a style URL, no key or map ID, `worker-src blob:`), MIGRATION, and the site's hero, title and install box naming both providers
- 2026-10-22 Added MapLibre versions of the examples: every one but route (Google only: MapLibre has no routing) as a page on the MapLibre CDN script and vanilla and React versions on maplace/maplibre, in examples/<name>/maplibre/, each the same map as on Google; on MapLibre, mixed's group C has no route and styled switches between OpenFreeMap's light and dark styles.
- 2026-10-22 Fixed on MapLibre: popup content is dark text on the white bubble on a page with light text, as on Google.
- 2026-10-22 Fixed on MapLibre: a page's own cursor on its map is given back once the pointer leaves a location and on destroy, no longer wiped; clusters and clickable markers show a pointer, as on Google.
- 2026-10-22 Added clustering on MapLibre: `cluster: true` groups `maplace/maplibre`'s markers as on Google, into the same clusters at the same view, the selected location on its own and hidden ones in none; a cluster, a button titled "Cluster of N locations", zooms in when clicked or on Enter; an `editable` marker is dragged, as on Google
- 2026-10-22 Added circles and editable shapes on MapLibre: circles drawn in metres, stacked and styled as Google's, shapes reshaped by dragging their handles with edits reported as on Google, and polylines and polygons across ±180 drawn the short way
- 2026-10-22 Added `maplace/element/maplibre` and the CDN script `maplace-element-maplibre.iife.js`: `<maplace-map>` on MapLibre, its style from `map-style` and MapLibre's options from `map-options`; the script bundles maplibre-gl, its worker and its stylesheet, so a page needs it alone; and `<MaplaceMap createAdapter={createMapLibreAdapter}>` draws React's popups and icons on MapLibre
- 2026-10-22 Added a panel like MapLibre's own controls around what goes on a MapLibre map (`mountControl`): its background, rounding, ring and margins, 13px text and form controls, maplace's lists scrolling within the map's height, light whatever the page's scheme (`.maplace-control`, `.maplace-maplibre-map`, styles in `:where()`, off under `data-maplace-unstyled`)
- 2026-10-21 Added `maplace/maplibre`, maplace on MapLibre GL JS: `createMapLibreAdapter` and `createMapLibreMap`, on OpenFreeMap's tiles unless `mapStyle` names another style, drawing markers (a pin, or the page's icon), polylines and polygons in their styles, popups headed by their title, the store's views, and clicks, hover and the viewport reported; `maplibre-gl` and its stylesheet are the page's to install
- 2026-10-21 Added `data-maplace-unstyled`: on any element, it turns maplacejs's default styles off inside it, but for what its markup needs, and the Styling reference page lists the classes maplacejs's markup carries, `maplace-list-view` on every list view's element among them
- 2026-10-21 Changed the mixed, tabs and polyline examples, in all three versions: mixed marks the group shown as a pressed button (`aria-pressed`), the tabs' row no longer overflows into a scrollbar, and polyline's list beside the map has a heading, "Along the trail"
- 2026-10-20 Changed Google popups to show the location's title as their heading, beside the close button, where Google left an empty row; a popup's content no longer needs the title, and sits 12px in from the bubble's right and bottom as from its left, its first and last child's own margins left out
- 2026-10-20 Changed how overlapping shapes stack: the smaller in front, so a circle or polygon inside another stays clickable, a line in front of any area, the later added first among shapes of one size, whatever is hovered or selected; markers keep their order, above every shape
- 2026-10-20 Changed the Google map ID to optional: `createGoogleAdapter()`, `createGoogleMap("#map")` and a `<maplace-map>` without `map-id` use Google's `DEMO_MAP_ID` and warn once in the console that it isn't for production; the examples leave it out but for styled
- 2026-10-20 Changed `<maplace-map>` to be 24rem tall unless the page sets its height (a page sizing it by its layout, `inset: 0` or a grid's row, sets `height: auto`), and its list beside the map to go under it on a screen narrower than 40rem, within that height
- 2026-10-20 Changed the examples for a phone and a reader's eye: route's directions in a bordered panel apart from the map, its legs' headings kept in view and a shade where there is more; circles' radius and custom-list's choices spaced; tabs' and the beside lists' vanilla and React versions sized as the element is
- 2026-10-19 Changed the menu, styled and route examples, in all three versions: the menu's select is headed "Choose a location:", menu's checkbox and styled's button sit in a paragraph above the map as mixed's buttons do, the button naming the theme it switches to ("Dark theme", "Light theme") in place of a pressed "Dark", and route's directions scroll within 16rem
- 2026-10-19 Changed the circles, polyline, mixed and route examples: their vanilla and React versions put the list beside the map, as their page does, so all three look the same
- 2026-10-19 Changed the vanilla examples to their shortest form: one `createGoogleMap` call where the map is a store, Google and a list, `attach` with a selector elsewhere, every behaviour kept
- 2026-10-19 Changed `attach` to take a selector as well as an element: `attach(adapter, "#map")`; a selector matching nothing, or not valid, is `invalid-input`
- 2026-10-19 Added `createGoogleMap(container, options)` in `maplace/google`: a store on a Google map in one call, as 0.2's `new Maplace(options).Load()`, with maplace's list on the map or in the page through `list`
- 2026-10-19 Added `<LocationList position>`: maplace's list on the map from React, its panel hiding with an empty list and its entries scrolling under its heading
- 2026-10-19 Fixed a map opening on a selected marker without a zoom: it showed the whole world; it now opens on that place, fitted as one place is (centred at zoom 15 at most)
- 2026-10-19 Changed the tabs example: drawn as tabs, the chosen tab's details in a panel right below them and above the map, in all three versions
- 2026-10-19 Changed the tabs example to start on its first place with its details shown and the chosen tab drawn as a tab, and the custom-list example to sit top right
- 2026-10-19 Changed lists, selects and your own controls on a Google map to sit in a panel like Google's controls: its background, shadow and margin, 13px text and form controls whatever the map inherits, maplace's lists scrolling within the map's height, in the map's colour scheme rather than the page's (`.maplace-control`, styles in `:where()`)
- 2026-10-18 Added the styled example (a light or dark map and Google's map options, a toggle opening the map again where it was) and the custom-list example (a list view of your own, as 0.2's checks menu), in all three versions
- 2026-10-18 Changed the examples to show as much as 0.2's demos: markers with image icons, a location's own zoom, one not listed, the list on the map under a heading and a click adding a marker; circles in their own colours with popups, one selected at start and one resizable with its radius shown; an editable trail with points of interest; a route through Zurich with directions by leg; 0.2's five data sets swapped in live (the data now `mixed-a.json` … `mixed-e.json`)
- 2026-10-18 Added `editable` to `<maplace-location>`, the location's `editable`; it and `listed` are true when present with no value, as HTML's booleans are
- 2026-10-18 Added `listedLocations(snapshot)` in `maplace`: the locations maplace's lists list, in data order, for a list of your own
- 2026-10-18 Changed `<maplace-map hold>`: a held map builds its list on `release()`, so a list view your page defines before releasing it is no error
- 2026-10-18 Added `color-scheme` and `map-options` to `<maplace-map>` on Google: the map's light, dark or system colour scheme, and Google's map options as JSON (as `mapOptions`, without centre, zoom, map ID, colour scheme or `styles`); changing either opens the map again where it was, keeping its locations and selection; a bad value is an error naming the attribute
- 2026-10-18 Added the list view's `heading` option: a heading above the entries, beside the map or on it, the list's accessible name unless `label` is given; element `list-heading`, React's `<LocationList heading>`
- 2026-10-18 Added `defineListView(name, factory)` in `maplace/element`: your own list view for `<maplace-map list="<name>">`, given the store, the list options and the locations maplace's lists show, placed by `list-position` as the built-in lists are, and built as soon as it is defined (on the CDN script, `customElements.get("maplace-map").defineListView`); any list beside the map now takes the list's width
- 2026-10-18 Changed the adapter host: `reportRouteChange(route, result)` and a `route-failed` `reportError(error, route)` name the route they were computed for, and the store ignores either for any route but its current one; a result whose legs don't run between its route's stops throws
- 2026-10-18 Added `listed: false`: a location drawn on the map and selectable there but left out of every list view, as 0.2's `on_menu: false` did; `listed="false"` on `<maplace-location>`; see [MIGRATION.md](MIGRATION.md)
- 2026-10-18 Added a location's own `zoom`: selecting it without a zoom of the select's (a click on its marker or in the list, `selectedId`, `select(id)`) centres it at that zoom, a shape too in place of its fit; `zoom` on `<maplace-location>`, as 0.2's `zoom` did; see [MIGRATION.md](MIGRATION.md)
- 2026-10-18 Changed the examples: every Vanilla and React version is a complete program with the HTML it mounts on (`vanilla.html`, `react.html`, Maps JS from Google's bootstrap loader), the same map as its page; the React versions render their own root, and the site runs any of the three live
- 2026-10-18 Added the `mapClick` event: a single click on the map itself, not on a location, with its `position`; it still clears the selection, and a double- or triple-click (Google's zoom) fires neither; `maplace-mapclick` on the element, `onMapClick` in React
- 2026-10-18 Changed the adapter host: `reportSelectionChange` takes a location's id only, and a click on the map is `reportMapClick(position)`
- 2026-10-18 Added the `locationEdit` event: while a user drags a marker or reshapes a shape, its geometry so far, never written to the store, the last one where the edit ended (`locationChange` still fires once, on release); `maplace-locationedit` on the element, `onLocationEdit` in React. On Google, a shape's edit comes once, as its handle is let go
- 2026-10-18 Added `route.via`: stops a route passes through without ending a leg (Google's via waypoints), as 0.2's `stopover: false` did; see [MIGRATION.md](MIGRATION.md)
- 2026-10-18 Added turn-by-turn steps to each route leg: `steps`, each with its `instruction`, `distanceMeters` and `durationSeconds`, so a page renders its own directions as 0.2's `directions_panel` did; see [MIGRATION.md](MIGRATION.md)
- 2026-10-18 Added selected and hovered styles for shapes: `selectedStyle` and `hoveredStyle` beside `style`, per shape and as the store's defaults (React props of the same names), `shape-style`, `selected-style` and `hovered-style` on `<maplace-location>`; the built-in look fills only what they leave unset
- 2026-10-18 Added `<MapControl position>` to `maplace/react`: inside `<MaplaceMap>`, its children go on the map in that corner, a `<LocationList>` too; see [the README](README.md#with-react)
- 2026-10-18 Added a marker icon from HTML: `<maplace-location icon="…">` (an image URL) or a `<template data-icon>` child, marked `data-selected` and `data-hovered` for your CSS
- 2026-10-18 Changed selecting a shape: the map fits the circle, polygon or polyline, no closer than zoom 15, where it used to pan to its centre; `select(id, { zoom })` still centres it at that zoom, and markers still pan
- 2026-10-18 Added a selected and hovered look for shapes: a heavier stroke and a stronger fill, wherever the shape's `style` (or the store's) leaves those fields unset
- 2026-10-18 Added default styles for the list view and popups: options as buttons with hover and selected states, popup content in dark text on Google's white bubble, every selector in `:where()` so your rules win; see [the README](README.md)
- 2026-10-18 Fixed "fit all" listed twice in Safari's native select: with `fitAllLabel`, the select shows "fit all" itself while nothing is selected
- 2026-10-17 Changed the event names to say what changed: `selectionChange`, `hoverChange`, `locationChange`, `viewportChange` and `routeChange` (were `select`, `hover`, `change`, `viewport` and `route`), with the element's `maplace-*` events, React's `on*` props and the adapter host's `report…` methods named after them; see [the events table](MIGRATION.md#events)
- 2026-10-17 Added `"use client"` to `maplace/react`, so a React Server Component renders `<MaplaceProvider>` and `<LocationList>` with its data; see [the README](README.md#with-react)
- 2026-10-17 Added `popupContent` and `markerIcon` on `<MaplaceMap>`: popups and markers as React content, rendered in place; see [the README](README.md#with-react)
- 2026-10-17 Added `maplace/react`: `<MaplaceProvider>`, `<MaplaceMap>`, `<LocationList>` and `useMaplace()`, with the selection controlled or not and the filter and route as props; see [the README](README.md#with-react)
- 2026-10-16 Changed everything: maplace 1.0 is a rewrite, with a new API (a headless store, a Google adapter, a list view and the `<maplace-map>` element) and no jQuery; see [the README](README.md), [MIGRATION.md](MIGRATION.md) for moving a 0.2 page, and [the 1.0 RFC](docs/rfc-1.0.md)

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
