# Changelog

One dated line per change a reader would notice, newest first, written in the commit that makes it; an issue the change closes is named as `#N` at the line's end. Lines above the first version heading are unreleased: the next release lists them under its own heading and turns them into its release notes.

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
