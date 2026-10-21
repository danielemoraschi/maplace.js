# Migrating from 0.2 to 1.0

maplacejs 1.0 is a rewrite. A 0.2 page keeps working on 0.2: its code stays in the tag [`0.2.10`](https://github.com/danielemoraschi/maplace.js/tree/0.2.10). This guide moves a page to 1.0: what changed, a page before and after, how to convert your locations, then every 0.2 option, field, method and callback with what replaces it.

## What changed

- **No jQuery and no global.** One CDN script defines the `<maplace-map>` element, or you import ES modules from npm.
- **Locations have an `id`.** Selection, events and updates name a location by its id, not its position in the array.
- **`lon` is `lng`**, as Google and MapLibre name it, with no alias.
- **Text is text.** Titles and string content are never inserted as HTML; `html` needs a `sanitize` function you provide (DOMPurify, for one).
- **One kind of change, after it happened.** The `before…` callbacks are gone; events such as `selectionChange`, `locationChange` and `routeChange` report what changed.
- **A map ID, for production**: maplacejs draws advanced markers, which need a map ID. As in 0.2, a page needs none to start: without one the map uses Google's `DEMO_MAP_ID` and warns once in the console that it is for development ([key and map ID](docs/reference/setup.md#key-and-map-id)).

## Before and after

A 0.2 page loaded jQuery and Google Maps, then Maplace:

```html
<script src="jquery.min.js"></script>
<script src="https://maps.google.com/maps/api/js?key=YOUR_KEY"></script>
<script src="maplace.min.js"></script>
<div id="gmap"></div>
<script>
  new Maplace({
    locations: [
      { lat: 41.9028, lon: 12.4964, title: "Rome" },
      { lat: 45.4642, lon: 9.19, title: "Milan" },
    ],
    controls_type: "list",
    controls_on_map: false,
  }).Load();
</script>
```

In 1.0 the element does the same, loading Google Maps itself:

<!-- example: packages/maplace/examples/quick-start/page.html -->
```html
<script src="https://cdn.jsdelivr.net/npm/maplace@1/dist/maplace-element.iife.js"></script>
<maplace-map api-key="YOUR_KEY" list>
  <maplace-location location-id="rome" lat="41.9028" lng="12.4964" title="Rome"></maplace-location>
  <maplace-location location-id="milan" lat="45.4642" lng="9.19" title="Milan"></maplace-location>
</maplace-map>
```

A page that builds the map in code makes the same call 0.2 made, `createGoogleMap` from npm, on a page that loads Maps JS with Google's bootstrap loader ([README](README.md#with-a-bundler)); the list goes where 0.2's `controls_div` put it:

```ts
import { createGoogleMap } from "maplace/google";

createGoogleMap("#gmap", {
  locations: [
    { id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" },
    { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan" },
  ],
  list: { container: "#controls" },
});
```

## Converting your locations

0.2 locations become 1.0 locations in a few lines: an id from the old 1-based position, `lon` renamed, `zoom` kept, and anything else of yours in `data`. This snippet is [`packages/maplace/examples/migrate/from-0.2.ts`](packages/maplace/examples/migrate/from-0.2.ts), type-checked in CI:

<!-- example: packages/maplace/examples/migrate/from-0.2.ts -->
```ts
// Converting 0.2 locations: ids from the old 1-based index, `lon` → `lng`, `zoom` kept.
import { createMaplace, type MarkerLocation } from "maplace";

interface Legacy {
  readonly lat: number;
  readonly lon: number;
  readonly title?: string;
  readonly html?: string;
  readonly icon?: string;
  readonly zoom?: number;
}

function toLocation(legacy: Legacy, index: number): MarkerLocation {
  const { lat, lon, title, html, icon, zoom } = legacy;
  return { id: String(index + 1), lat, lng: lon, title, html, icon, zoom };
}

declare const old: readonly Legacy[];
declare const sanitize: (html: string) => string; // e.g. DOMPurify.sanitize

const locations = old.map((legacy, index) => toLocation(legacy, index));
const maplace = createMaplace({ locations, sanitize });
// 0.2's `ViewOnMap(1)`, at the location's own zoom:
const [first] = maplace.getSnapshot().locations;
if (first) maplace.select(first.id);
```

## Everything a 0.2 page could touch

From the source and README of tag `0.2.10` and the old docs site. "Dropped" always names the replacement or the reason.

### Options

| 0.2 option | 1.0 |
|---|---|
| `map_div` | `createGoogleMap('#map', …)`'s container (an element or a selector), the container passed to `attach`, or `<maplace-map>` itself |
| `controls_div`, `controls_on_map`, `controls_position` | `createGoogleMap`'s `list: { position }` (a corner, default top right) or `list: { container }` (an element or a selector, as `controls_div`), element `list-position` (a corner, or `outside`), React's `<LocationList position>`; with the parts, put `listView.element` anywhere in the page or on the map with `adapter.mountControl` |
| `generate_controls`, `force_generate_controls` | a list exists only when asked for, at any number of locations |
| `controls_type` (`dropdown` \| `list`) | list view `as: 'select' \| 'list'` (`createGoogleMap`'s `list: { as }`), element `list="select"` / `list`, or `list="<name>"` for a view of yours (`defineListView`) |
| `controls_cssclass`, `controls_applycss` | your own classes; default styles use `:where()` so yours win, and `controls_applycss: false` is `data-maplace-unstyled` on an element holding the map and its list (the map then needs a height of yours, as in 0.2); the classes to style are on [Styling](docs/reference/styling.md) (on a Google map, the panel is `.maplace-control`) |
| `controls_title` | list view `heading` (`createGoogleMap`'s `list: { heading }`, element `list-heading`, `<LocationList heading>`), shown above the list on the map or beside it |
| `type` (one per map) | `type` per location, so one map mixes markers and shapes |
| `type: 'directions'` | `setRoute({ stops })` through your own locations |
| `type: 'fusion'`, `fusion_options` | dropped: Google shut down Fusion Tables in 2019 |
| `view_all`, `view_all_text` | `fitAllLabel` (element `fit-all-label`); no entry unless set |
| `start` | `selectedId` (element `selected-id`, React `defaultSelectedId`) |
| `locations` | kept; every location needs an `id` |
| `shared` (the README calls it `commons`) | dropped: spread your defaults when mapping the data |
| `show_markers` | `visible: false` per location; to centre a map without markers, `view: { kind: 'center', … }` |
| `show_infowindows`, `infowindow_type` | a location opens a popup only when it has `content` (or `html`): leave it out for none; there is only one kind of popup |
| `map_options` (with `set_center`, `zoom`) | `createGoogleAdapter({ mapOptions })`, on the element `map-options` (JSON); centre and zoom through `view` |
| `styles` | map ID and Cloud styling, plus `colorScheme` (the element's `color-scheme`) for light and dark ([RFC §3, Loading](docs/rfc-1.0.md#loading-providers-and-packaging)) |
| `stroke_options`, `circle_options` | `style` option and per-location `style`; the circle's `radius` is a field |
| `directions_options.travelMode` | `route.travelMode` |
| `directions_options.avoidHighways`, `avoidTolls` | dropped |
| `directions_options.unitSystem` | dropped: results are metres and seconds, format them as you like |
| `directions_options.optimizeWaypoints`, `provideRouteAlternatives` | dropped: one route per map, stops in your order |
| `directions_panel` | dropped: render each leg's `steps` from the `routeChange` event |
| `draggable`, `editable` (map-wide) | `editable` per location, for markers and shapes alike; dragging the route itself is gone |
| `listeners` | the `mapClick` event (`{ position }`) for a click on the map; for any other map event, pass your own map (`createGoogleAdapter({ map })`) and add listeners to it |
| `pan_on_click` | `select(id, { pan: false })` from code; the map always brings a clicked location into view (a marker panned to, a shape fitted) |
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
| `zoom` | kept: the zoom selecting it shows it at, a click on its marker or in the list too; `select(id, { zoom })` overrides it |
| `show_infowindow` | `false` kept a location's info window shut: leave its `content` (and `html`) out, and a click selects it without a popup |
| `visible` | kept, default `true` (0.2's docs said `false`, its code did `true`) |
| `animation` | dropped: animate the `icon` node with CSS |
| `stopover` | `route.via`: list the stops the route passes through without ending a leg |
| `stroke_options`, `circle_options` | `style`; the circle's `radius` |
| `type` | kept: `marker`, `circle`, `polyline`, `polygon`; a polyline or polygon is one location with a `path` |
| `zIndex` | dropped: stacking order is fixed ([RFC §3, decisions from the 0.2 issues](docs/rfc-1.0.md#decisions-from-the-02-issues)) |
| `on_menu` | `listed: false` (element `listed="false"`): on the map and selectable there, left out of every list view |
| `pan_on_click` | dropped per location |
| `draggable` | `editable`: one word for dragging markers and reshaping shapes |
| any other field, including Google marker options | your fields go in `data`; Google options belong on your own map |

### Methods

| 0.2 method | 1.0 |
|---|---|
| `new Maplace(options).Load()` | `createGoogleMap('#map', options)`, or its parts `createMaplace(options)` then `attach(adapter, '#map')`, or `<maplace-map>` |
| `Load(options)` | the setter for what changed: `setLocations`, `setRoute`, `setFilter`, `setView` |
| `Load(true)` (rebuild) | `detach()`, then `attach()` with a new adapter |
| `Loaded()` | `getSnapshot().loadState`, or `await whenReady()` |
| `ViewOnMap(index)` | `select(id)`, at the location's own `zoom` as in 0.2 |
| `ViewOnMap('all')` | `select(undefined)` and `fitAll()` |
| `CloseInfoWindow()` | `select(undefined)`: the popup follows the selection |
| `SetLocations(locations, reload)` | `setLocations(locations)`; only the differences reach the map |
| `AddLocations`, `AddLocation`, `RemoveLocations` | `setLocations` with the new array: one way to change data |
| `ShowOnMenu(index)` | dropped: a location is in the list when it is shown and its `listed` isn't `false` |
| `AddControl(name, menu)` | `defineListView(name, factory)` in `maplace/element`, used as `list="<name>"`; in code, `createListView(maplace, { render })` or your own view from `subscribe` and `getSnapshot` |
| internals (`oMap`, `markers`, `circles`, …) | pass your own map and keep the reference |

### Events

| 0.2 callback | 1.0 event | How |
|---|---|---|
| `beforeViewAll`, `beforeShow`, `beforeOpenInfowindow`, `beforeCloseInfowindow` | `selectionChange`, `popupOpen`, `popupClose` | dropped: they ran just before 0.2 acted and couldn't stop it; run the same code on the event that follows the change |
| `afterShow` | `selectionChange` | |
| `afterViewAll` | `selectionChange`, `viewportChange` | the selection cleared (`id` undefined), then the view settled |
| `afterCreateMarker` | — | dropped: an `icon` function, or CSS on `data-selected` / `data-hovered` |
| `afterOpenInfowindow`, `afterCloseInfowindow` | `popupOpen`, `popupClose` | the content is in the DOM; `popupOpen` fires again when an open popup gets new content |
| `afterRoute` | `routeChange` | with legs (each with its steps), distance and duration; again, `result` undefined, when the route is cleared |
| `onPolylineClick`, `onPolygonClick` | `selectionChange` | shapes are locations |
| `circleRadiusChanged`, `circleCenterChanged`, `dragEnd` | `locationChange` | with the location and its `previous` value |
| `drag` | `locationEdit` | the geometry so far, never written to the store; its last is where the drag ended |
| `dragStart` | — | dropped: the first `locationEdit` of a drag comes as it starts to move |

### Behaviour that changes

- Locations are identified by `id`, not by their 1-based position.
- Polyline, polygon and route points are no longer list entries; route stops are your own locations and stay visible.
- Titles and string content are text. 0.2 inserted titles into the menu as raw HTML.
- No jQuery and no `Maplace` global: ES modules or one CDN script. With the element, Google Maps no longer has to load first (the element adds Google's bootstrap); in code, the page loads it and the adapter imports what it needs.
- The menu's inline styles are replaced by a stylesheet you can override.
- Bugs and requests from the 0.2 issues (explicit centre overridden by fit, hidden containers, stacking, …) are settled in [RFC §3, decisions from the 0.2 issues](docs/rfc-1.0.md#decisions-from-the-02-issues).

Never released (the unmerged `develop` branch): `onPolylineClick` is `selectionChange`; the documented manual resize trigger is unnecessary; the `FreezeZoom` / `UnFreezeZoom` stubs are `mapOptions.gestureHandling`.
