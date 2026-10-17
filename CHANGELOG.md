# Changelog

One dated line per change a reader would notice, newest first, written in the commit that makes it; an issue the change closes is named as `#N` at the line's end. Lines above the first version heading are unreleased: the next release lists them under its own heading and turns them into its release notes.

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
