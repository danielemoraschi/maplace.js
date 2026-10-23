# The element

`<maplace-map>` is a map with an optional list, and `<maplace-location>` one location inside it. They are the whole API of a page with no build step: one script from the CDN defines both, with the Google provider, or, the MapLibre script, with MapLibre's.

<!-- example: packages/maplace/examples/quick-start/page.html -->
```html
<script src="https://cdn.jsdelivr.net/npm/maplace@1/dist/maplace-element.iife.js"></script>
<maplace-map api-key="YOUR_KEY" list>
  <maplace-location location-id="rome" lat="41.9028" lng="12.4964" title="Rome"></maplace-location>
  <maplace-location location-id="milan" lat="45.4642" lng="9.19" title="Milan"></maplace-location>
</maplace-map>
```

From npm, `import "maplace/element/google"` defines the same elements with the Google provider, `import "maplace/element/maplibre"` with the MapLibre provider, and `maplace/element` with none ([Setup](setup.md)). Defining them twice is harmless; a second, different copy of maplacejs on the page logs an error and leaves the first in place.

## Size

The element is 24rem tall unless the page sets its height (`maplace-map { height: 30rem }`); a page sizing it by its layout instead (`position: absolute; inset: 0`, a grid's row) sets `height: auto`. The map fills it, with its list beside it, or, on a screen narrower than 40rem, under it, at most 40% of the height, scrolling. Its own styles come with the element's script, so a page loading that script late keeps the room with `maplace-map:not(:defined) { display: block; height: 24rem; }`.

## Map attributes

| Attribute | What |
|---|---|
| `list` | Present: a list of the locations; `list="select"`: a native select; `list="<name>"`: a [list view of yours](#list-views). Absent: no list |
| `list-position` | `outside` (beside the map, the default; under it, within the element's height, on a screen narrower than 40rem), or a corner of the map: `top-left`, `top-right`, `bottom-left`, `bottom-right` |
| `fit-all-label` | The label of a first list entry that clears the selection and fits all locations |
| `list-heading` | A heading above the list, beside the map or on it; the list's accessible name |
| `provider` | The registered provider to draw with; defaults to the only one registered, and is required when several are. A change opens the map again on it |
| `cluster` | Clusters markers (on Google's CDN, the cluster script; the MapLibre script clusters as it is); can't change once the store exists |
| `hold` | Stays idle, with no provider request and no list built, until `release()` |
| `selected-id` | The location selected at start, like `<input value>`; later changes go through `maplace` |

`list`, `list-position`, `fit-all-label` and `list-heading` are live: a change builds the list again. The Google provider reads its own attributes, such as `api-key` and `map-id`, and the MapLibre provider `map-style` and `map-options`, when the map opens; a change of a map setting (`color-scheme`, `map-style` or `map-options`, whichever the provider) opens it again where it was: provider attributes on [Google](google.md#provider-attributes) and [MapLibre](maplibre.md#provider-attributes).

## Properties and methods

| Property | What |
|---|---|
| `locations` | The locations, as an array; once set, it wins over those written inside the element |
| `route` | The [route](store.md#routes), or `undefined` |
| `sanitize` | The store's `sanitize` option, so locations given as JSON or through `locations` can use `html`. Set it before the map opens; set later, it is misuse |
| `maplace` | The underlying [store](store.md), for anything the attributes don't cover |
| `loadState` | `error` while a misuse stands, else the store's: `idle`, `loading`, `ready` or `error` |
| `release` | `release()` starts loading an element held with `hold` |

The store is created when the element first connects (or `maplace`, `locations` or `route` is first read), from `cluster`, `sanitize`, `selected-id` and the locations, and lives as long as the element. Removed from the page, the map closes and the store goes back to `idle`, keeping its locations, selection and listeners; connected again, a new map opens. A move within one task keeps the map.

## Events

The store's [events](store.md#events), as DOM events on the element, named in lower case. They bubble, and their `detail` is the store event's payload.

| Event | Store event |
|---|---|
| `maplace-selectionchange` | `selectionChange` |
| `maplace-hoverchange` | `hoverChange` |
| `maplace-mapclick` | `mapClick` |
| `maplace-locationedit` | `locationEdit` |
| `maplace-locationchange` | `locationChange` |
| `maplace-popupopen` | `popupOpen` |
| `maplace-popupclose` | `popupClose` |
| `maplace-viewportchange` | `viewportChange` |
| `maplace-routechange` | `routeChange` |
| `maplace-error` | `error`, and the element's own [misuse](#misuse) |

## Load states

The element's `loadState` is shown as the custom state `:state(idle)` (also `loading`, `ready` and `error`), so CSS styles the map in each, such as a consent placeholder. The element never writes its own attributes or styles; its default styles, and how to turn them off, are on [Styling](styling.md). A map with `hold` asks nothing of its provider until `release()`: a consent banner calls it once the visitor agrees, and a held map builds its list on release too.

## Location attributes

| Attribute | What |
|---|---|
| `location-id` | The location's `id` (not `id`, which must be unique on the page) |
| `lat`, `lng` | A marker's position, or a circle's centre |
| `title` | Its `title`: the list label, the accessible name on the map and its popup's heading |
| `type` | `marker` (the default) or `circle`; a polyline or polygon needs a `path`, so it goes in the map's inline JSON ([data](#data)) |
| `group` | Its `group` |
| `radius` | A circle's radius, in metres |
| `icon` | A marker's image URL |
| `zoom` | The zoom selecting it shows it at |
| `listed` | `"false"` keeps it out of the list; on the map still |
| `editable` | Lets the user drag or reshape it |
| `shape-style`, `selected-style`, `hovered-style` | A shape's `style`, `selectedStyle` and `hoveredStyle`, as JSON (not `style`: that is HTML's inline CSS) |

Each attribute sets the [location field](locations.md) of the same meaning. Booleans are as HTML writes them: present, empty or `"true"` is true, `"false"` false, anything else misuse naming the attribute.

## Templates

A `<template>` child of `<maplace-location>` is the popup's content, and a `<template data-icon>` child the marker, in place of `icon` (one element, or a span around the rest), cloned for each state. Templates are the page's own markup and trusted, so they skip `sanitize`; `html` set through `locations` still needs it.

## Data

A map's locations come from the `locations` property once it is set; else from one inline `<script type="application/json">` child, or from `<maplace-location>` children. Both a script and location children is misuse. Children and the script are watched for changes. The element never fetches: to load data from a URL, fetch it and set `locations`.

<!-- example: packages/maplace/examples/polygon/page.html -->
```html
<!doctype html>
<script src="https://cdn.jsdelivr.net/npm/maplace@1/dist/maplace-element.iife.js"></script>
<!-- An editable area; edits are written back and announced. -->
<maplace-map id="polygon-map" api-key="YOUR_KEY">
  <script type="application/json">
    [{ "id": "park", "type": "polygon", "title": "Park", "editable": true,
       "path": [{ "lat": 41.91, "lng": 12.48 }, { "lat": 41.92, "lng": 12.49 }, { "lat": 41.90, "lng": 12.50 }] }]
  </script>
</maplace-map>
<script>
  document.getElementById('polygon-map').addEventListener('maplace-locationchange', (event) => save(event.detail.location));
</script>
```

A map waits for the document to parse its children before it opens, whether parsed or created by a script, so its first view and `selected-id` see them all.

## Providers

`defineProvider(name, factory)` registers a provider for `provider="<name>"`: the factory gets the element and returns an adapter. `maplace/element/google` registers `google`, and `maplace/element/maplibre` registers `maplibre`. With both registered (both element entries imported from npm), each map names one with `provider`, else the map is misuse naming `provider` (`several providers are registered ("google", "maplibre"): set provider`). A map naming a provider not registered yet opens once it is.

## List views

`defineListView(name, factory)` registers a list view for `list="<name>"`. The factory gets the store and a setup: `options`, the list options from the attributes (`fitAllLabel`, `heading`), and `listed()`, the locations maplacejs's own lists show now, to read again on each store change. It returns a [`ListView`](store.md#list-view-options), placed by `list-position` as the built-in ones are. A name defined after the map opened builds its list then. Defining a built-in name (`select`), or one already given to another factory, throws; a `list` naming a view not defined is misuse until it is.

A page on the CDN script, which imports nothing, calls it as `Maplace.defineListView`. [The custom-list example](../../packages/maplace/examples/custom-list/) defines one.

## Misuse

Where no caller can catch a throw, misuse sets the element's error state (`loadState` and `:state(error)`) and dispatches `maplace-error`; nothing fails silently. The error stands until the misuse is corrected: bad locations or a bad route keep the previous ones until valid ones are given, and a `selected-id` the locations don't have is selected once they do. The codes are in the [API reference](api.md#misuse-codes), the rules in [RFC §3 Errors](../rfc-1.0.md#errors).
