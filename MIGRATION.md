# Migrating from 0.2 to 1.0

Maplace.js 1.0 is a rewrite. A 0.2 page keeps working on 0.2: its code stays in the tag [`0.2.10`](https://github.com/danielemoraschi/maplace.js/tree/0.2.10). On npm, `maplace-js` becomes `@maplacejs/maplace`. This guide moves a page to 1.0: what changed, a page before and after, how to convert your locations, then every 0.2 option, field, method and callback with what replaces it.

## What changed

- **No jQuery, and one store per map.** One CDN script defines the `<maplace-map>` element and sets `Maplace`, a namespace of functions (`Maplace.createGoogleMap(...)` is 0.2's `new Maplace(...).Load()`), or you import ES modules from npm.
- **Google Maps or MapLibre.** 0.2 drew on Google only. 1.0 draws the same locations, list and events on either, and MapLibre on OpenFreeMap's tiles needs no key ([MapLibre adapter](docs/reference/maplibre.md)).
- **Locations have an `id`.** Selection, events and updates name a location by its id, not its position in the array.
- **`lon` is `lng`**, as Google and MapLibre name it, with no alias.
- **Text is text.** Titles and string content are never inserted as HTML; `html` needs a `sanitize` function you provide (DOMPurify, for one).
- **One kind of change, after it happened.** The `before…` callbacks are gone; events such as `selectionChange`, `locationChange` and `routeChange` report what changed.
- **On Google, a map ID for production**: Maplace.js draws advanced markers, which need a map ID. As in 0.2, a page needs none to start: without one the map uses Google's `DEMO_MAP_ID` and warns once in the console that it is for development ([key and map ID](docs/reference/setup.md#key-and-map-id)).
- **Apache-2.0, not MIT.** 1.0 is under the [Apache-2.0 licence](LICENSE); 0.2 stays MIT.

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
<script src="https://cdn.jsdelivr.net/npm/@maplacejs/maplace@1/dist/maplace-element.iife.js"></script>
<maplace-map api-key="YOUR_KEY" list>
  <maplace-location location-id="rome" lat="41.9028" lng="12.4964" title="Rome"></maplace-location>
  <maplace-location location-id="milan" lat="45.4642" lng="9.19" title="Milan"></maplace-location>
</maplace-map>
```

On MapLibre, the same page loads `maplace-element-maplibre.iife.js` and drops `api-key` ([quick start](README.md#quick-start)); [open the page from a web server](docs/reference/setup.md#use-a-web-server-for-maplibre), not directly as a file.

A page that builds the map in its own script, as 0.2's did, calls `Maplace.createGoogleMap` on the same CDN script, with no build step: `Maplace` is a namespace now, not a constructor, and the key goes in the options, Maplace.js loading Google Maps with it:

```html
<script src="https://cdn.jsdelivr.net/npm/@maplacejs/maplace@1/dist/maplace-element.iife.js"></script>
<div id="gmap" style="height: 24rem"></div>
<div id="controls"></div>
<script type="module">
  Maplace.createGoogleMap("#gmap", {
    apiKey: "YOUR_KEY",
    locations: [
      { id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" },
      { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan" },
    ],
    list: { container: "#controls" },
  });
</script>
```

On MapLibre, the MapLibre script and `Maplace.createMapLibreMap`, with no key.

A page with a bundler makes the same call, `createGoogleMap` from npm, on a page that loads Maps JS with Google's bootstrap loader ([README](README.md#with-a-bundler)); the list goes where 0.2's `controls_div` put it:

```ts
import { createGoogleMap } from "@maplacejs/maplace/google";

createGoogleMap("#gmap", {
  locations: [
    { id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" },
    { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan" },
  ],
  list: { container: "#controls" },
});
```

On MapLibre, `createMapLibreMap` from `@maplacejs/maplace/maplibre` takes the same options, on a page that installs `maplibre-gl` and imports its stylesheet instead of loading Maps JS ([README](README.md#with-a-bundler)).

## Converting your locations

The [snippet builder](https://maplacejs.com/builder/) does this in the browser: paste a 0.2 config, get a `<maplace-map>` with a preview, and a list of what wasn't carried over.

0.2 locations become 1.0 locations in a few lines: an id from the old 1-based position, `lon` renamed, a marker's other fields carried, and anything else of yours in `data`. This snippet is [`packages/maplace/examples/migrate/from-0.2.ts`](packages/maplace/examples/migrate/from-0.2.ts), type-checked in CI:

<!-- example: packages/maplace/examples/migrate/from-0.2.ts -->
```ts
// Converting 0.2 locations: ids from the old 1-based index, `lon` → `lng`, `zoom` kept.
import { createMaplace, type MarkerLocation } from "@maplacejs/maplace";

export interface Legacy {
  readonly lat: number;
  readonly lon: number;
  readonly title?: string;
  readonly html?: string;
  readonly icon?: string;
  readonly zoom?: number;
  readonly visible?: boolean;
  readonly show_infowindow?: boolean;
  readonly on_menu?: boolean;
}

export function toLocation(legacy: Legacy, index: number): MarkerLocation {
  const { lat, lon, title, icon, zoom, visible, show_infowindow, on_menu } = legacy;
  const id = String(index + 1);
  const html =
    show_infowindow === false
      ? undefined
      : legacy.html?.replace("%index", id).replace("%title", title ?? "");
  return { id, lat, lng: lon, title, html, icon, zoom, visible, listed: on_menu };
}

declare const old: readonly Legacy[];
declare const sanitize: (html: string) => string; // e.g. DOMPurify.sanitize

const locations = old.map((legacy, index) => toLocation(legacy, index));
const maplace = createMaplace({ locations, sanitize });
// 0.2's `ViewOnMap(1)`, at the location's own zoom:
const [first] = maplace.getSnapshot().locations;
if (first) maplace.select(first.id);
```

These snippets are TypeScript for a bundler; on a page of script tags, drop the types and imports and call the functions on `Maplace`. The one above carries a marker's fields. A circle takes this one, [`packages/maplace/examples/migrate/circle-from-0.2.ts`](packages/maplace/examples/migrate/circle-from-0.2.ts); the tables below cover the rest:

<!-- example: packages/maplace/examples/migrate/circle-from-0.2.ts -->
```ts
// Converting a 0.2 circle: its point is `center`, and `radius` is a field.
import type { CircleLocation } from "@maplacejs/maplace";
import { type Legacy, toLocation } from "./from-0.2";

interface LegacyCircle extends Legacy {
  readonly circle_options?: { readonly radius?: number };
}

export function toCircle(legacy: LegacyCircle, index: number): CircleLocation {
  const { id, lat, lng, title, html, zoom, listed } = toLocation(legacy, index);
  // 0.2's default `circle_options` beat a plain `radius`.
  const radius = legacy.circle_options?.radius ?? 100;
  return { type: "circle", id, center: { lat, lng }, radius, title, html, zoom, listed };
}
```

Data kept as GeoJSON needs no conversion of your own: `locationsFromGeoJSON` turns a FeatureCollection into locations ([Locations, from GeoJSON](docs/reference/locations.md#from-geojson)).

## Everything a 0.2 page could touch

From the source and README of tag `0.2.10` and the old docs site. "Dropped" always names the replacement or the reason.

### Options

| 0.2 option | 1.0 |
|---|---|
| `map_div` (default `#gmap`) | `createGoogleMap('#map', …)`'s (or `createMapLibreMap`'s) container (an element or a selector), the container passed to the store's `attach`, or `<maplace-map>` itself |
| `controls_div` (default `#controls`), `controls_on_map`, `controls_position` | `createGoogleMap`'s (or `createMapLibreMap`'s) `list: { position }` (a corner, default top right) or `list: { container }` (an element or a selector, as `controls_div`), element `list-position` (a corner, or `outside`), React's `<LocationList position>`; with the parts, put `listView.element` anywhere in the page or on the map with `adapter.mountControl` |
| `generate_controls`, `force_generate_controls` | 0.2 gave a dropdown on the map, top right, whenever there was more than one location. In 1.0 a list exists only when asked for, at any number of locations: the closest is `list="select" list-position="top-right" fit-all` on the element. Its first entry shows while all locations are fitted; once the map is on one location no option shows, so the entry can be chosen |
| `controls_type` (`dropdown` \| `list`) | list view `as: 'select' \| 'list'` (`createGoogleMap`'s (or `createMapLibreMap`'s) `list: { as }`), element `list="select"` / `list`, or `list="<name>"` for a view of yours (`defineListView`) |
| `controls_cssclass`, `controls_applycss` | your own classes; default styles use `:where()` so yours win, and `controls_applycss: false` is `data-maplace-unstyled` on an element holding the map and its list (the map then needs a height of yours, as in 0.2); the classes to style are on [Styling](docs/reference/styling.md) (on a Google or MapLibre map, the panel is `.maplace-control`) |
| `controls_title` | list view `heading` (`createGoogleMap`'s (or `createMapLibreMap`'s) `list: { heading }`, element `list-heading`, `<LocationList heading>`), shown above the list on the map or beside it |
| `type` (one per map) | `type` per location, so one map mixes markers and shapes |
| `type: 'directions'` | `setRoute({ stops })` through your own locations, on Google (MapLibre has no routing). Your key needs Google's Routes API, not the Directions API 0.2 used; without it no line draws and only the `error` event says why ([routes](docs/reference/google.md#routes)) |
| `type: 'fusion'`, `fusion_options` | dropped: Google shut down Fusion Tables in 2019 |
| `view_all`, `view_all_text` | 0.2 had the entry by default. `list: { fitAll: true }` (element `fit-all`) adds it, and `list: { fitAllLabel }` (element `fit-all-label`) sets its words |
| `start` | `selectedId` (element `selected-id`, React `defaultSelectedId`). A marker with no `zoom` opens centred at 15, where 0.2 kept the fit's zoom: add `view: { kind: 'fit-all', padding: 40 }` for that |
| `locations` | kept; every location needs an `id` |
| `shared` (the README calls it `commons`) | dropped: spread your defaults when mapping the data |
| `show_markers` | `visible: false` per location, which also leaves it out of the list, where 0.2 kept it; to centre a map without markers, `view: { kind: 'center', … }` |
| `show_infowindows`, `infowindow_type` | a location opens a popup only when it has `content` (or `html`): leave it out for none; there is only one kind of popup |
| `map_options` (with `set_center`, `zoom`) | `createGoogleAdapter({ mapOptions })`, on MapLibre `createMapLibreAdapter({ mapOptions })`, on the element `map-options` (JSON). MapLibre refuses Google's names it has its own for, saying which. Centre and zoom go through `view` ([the first view](docs/reference/store.md#the-first-view)), on the element the `center` (`"lat,lng"`) and `zoom` attributes: `set_center` in `mapOptions` is refused; `zoom` beside `start` is `selectedId` with `view: { kind: 'location', id, zoom }`, or on the element `selected-id` with `zoom` on that `<maplace-location>`, which selecting it later also uses |
| `styles` | on Google, a map ID and Cloud styling, plus `colorScheme` (the element's `color-scheme`) for light and dark ([RFC §3, Loading](docs/rfc-1.0.md#loading-providers-and-packaging)); a JSON style (a Snazzy Maps one, say) imported into a Cloud style in the Cloud console, which Google converts only approximately, then given as that style's map ID (`mapId`); on MapLibre, the map's style (`mapStyle`, the element's `map-style`), any provider's style URL or a MapLibre style as JSON; a Google JSON style won't work there, being another format, and there's no converter: choose a provider's style URL, such as OpenFreeMap's `https://tiles.openfreemap.org/styles/` `bright`, `liberty`, `positron` or `dark`, or make one in [Maputnik](https://maplibre.org/maputnik/). 0.2's several named styles, offered in Google's map type control, have no built-in switcher: on MapLibre, a `<select>` of yours sets `map-style`, and the map opens again where it was ([the styled example](packages/maplace/examples/styled/maplibre/page.html)); on Google, where the element's `map-id` isn't live, a new adapter with that style's map ID, through the parts (as [its script](packages/maplace/examples/styled/vanilla.ts) opens a new map for a colour scheme), each change a new map load, which Google bills |
| `stroke_options`, `circle_options` | `style` option and per-location `style` (element `shape-style`), [its fields](docs/reference/locations.md#styles) renamed: `strokeColor` is `stroke`, `strokeWeight` `strokeWidth`, `fillColor` `fill`. The circle's `radius` is a field |
| `directions_options.travelMode` | `route.travelMode` |
| `directions_options.avoidHighways`, `avoidTolls` | `route.avoid`: `["highways", "tolls"]`, and `"ferries"` too; on Google, driving routes only |
| `directions_options.unitSystem` | dropped: results are metres and seconds, format them as you like |
| `directions_options.optimizeWaypoints`, `provideRouteAlternatives` | dropped: one route per map, stops in your order |
| `directions_panel` | dropped: render each leg's `steps` from the `routeChange` event |
| `draggable`, `editable` (map-wide) | `editable` per location, for markers and shapes alike; dragging the route itself is gone |
| `listeners` | the `mapClick` event (`{ position }`) for a click on the map; for any other map event, pass your own map (`createGoogleAdapter({ map })` or `createMapLibreAdapter({ map })`) and add listeners to it |
| `pan_on_click` | `select(id, { pan: false })` from code; the map always brings a clicked location into view (a marker panned to, a shape fitted) |
| `debug` | the `error` event and `MaplaceError`; nothing is logged or silent |
| `visualRefresh` | dropped: Google removed the flag |

### Location fields

| 0.2 field | 1.0 |
|---|---|
| (array index) | `id`, required and unique |
| `lat` | kept; a circle's point is `center: { lat, lng }` |
| `lon` | `lng`, no alias |
| `title` | kept; plain text, also the marker's accessible name. A popup is now headed by it, so remove a heading in `html` that repeats it, or hide the popup's with `.maplace-popup-heading { display: none; }` (on Google the row with the close button stays) |
| `html` | `content` (text, a DOM node or a function), or `html` with a `sanitize` option (on a page of script tags, `DOMPurify.sanitize` from `https://cdn.jsdelivr.net/npm/dompurify@3/dist/purify.min.js`, set before the map opens: on the element, `map.sanitize` in a script right after it) |
| `%index`, `%title` in `html` | a `content` function, which gets the location: `title`, and 0.2's 1-based `%index` as `id` if you converted as above |
| `infoWindowMaxWidth` | `popup.maxWidth`, for all popups |
| `icon` | kept: an image URL, a DOM node or a function of the selected/hovered state. Its size and anchor: [Icons](docs/reference/locations.md#icons) |
| `image`, `image_w`, `image_h` | an `icon` node, e.g. a sized `<img>` |
| `zoom` | kept: the zoom selecting it shows it at, a click on its marker or in the list too; `select(id, { zoom })` overrides it |
| `show_infowindow` | `false` kept a location's info window shut: leave its `content` (and `html`) out, and a click selects it without a popup |
| `visible` | kept, default `true` (0.2's docs said `false`, its code did `true`) |
| `animation` | dropped: animate the `icon` node with CSS, and remove `google.maps.Animation.DROP` from your data ([below](#behaviour-that-changes)) |
| `stopover` | `route.via`: list the stops to pass through without ending a leg; in 0.2 that was every inner stop not marked `stopover: true` |
| `stroke_options`, `circle_options` | `style`; the circle's `radius`; a polyline's `geodesic` is now the location's own `geodesic` |
| `type` | kept: `marker`, `circle`, `polyline`, `polygon`; a polyline or polygon is one location with a `path`. 0.2 also drew a marker with its popup at each point, and at a circle's centre: add markers if you want them |
| `zIndex` | dropped: stacking order is fixed ([RFC §3, decisions from the 0.2 issues](docs/rfc-1.0.md#decisions-from-the-02-issues)) |
| `on_menu` | `listed: false` (element `listed="false"`): on the map and selectable there, left out of every list view |
| `pan_on_click` | dropped per location |
| `draggable` | `editable`: one word for dragging markers and reshaping shapes. A polyline or polygon can no longer be dragged whole |
| any other field, including Google marker options | your fields go in `data`; provider options belong on your own map |

### Methods

| 0.2 method | 1.0 |
|---|---|
| `new Maplace(options).Load()` | `Maplace.createGoogleMap('#map', options)` on the CDN script, `createGoogleMap('#map', options)` or `createMapLibreMap('#map', options)`, or their parts `createMaplace(options)` then `attach(adapter, '#map')`, or `<maplace-map>` |
| `Load()` later, after `new Maplace()` | `hold` and `release()` on the element, or `loading="lazy"` ([map attributes](docs/reference/element.md#map-attributes)); in code, make the map when you need it |
| `Load(options)` | the setter for what changed: `setLocations`, `setRoute`, `setFilter`, `setView`. To swap the whole set: `select(undefined)`, `setRoute(undefined)`, `setLocations(next)`, the new `setRoute` if any, then `fitAll()`; new ids can match old ones, hence that order. New view-all words: on the element set `fit-all-label`; in code, build the list with `createListView`, not `list:`, and make a new one |
| `Load(true)` (rebuild) | `detach()`, then `attach()` with a new adapter |
| `Loaded()` | `getSnapshot().loadState`, or `await whenReady()` |
| `ViewOnMap(index)` | `select(id)`, at the location's own `zoom` as in 0.2 |
| `ViewOnMap('all')` | `select(undefined)` and `fitAll()` |
| `CloseInfoWindow()` | `select(undefined)`: the popup follows the selection |
| `SetLocations(locations, reload)` | `setLocations(locations)`; only the differences reach the map |
| `AddLocations`, `AddLocation`, `RemoveLocations` | `setLocations` with the new array: one way to change data |
| `ShowOnMenu(index)` | dropped: a location is in the list when it is shown and its `listed` isn't `false` |
| `AddControl(name, menu)` | `defineListView(name, factory)` in `@maplacejs/maplace/element`, used as `list="<name>"`; in code, `createListView(maplace, { render })` or your own view from `subscribe` and `getSnapshot`. A control that isn't a menu goes on the map the same way: with the element, in a view of yours ([List views](docs/reference/element.md#list-views)); with the parts, `adapter.mountControl` |
| internals (`oMap`, `markers`, `circles`, …) | pass your own map and keep the reference |

### Events

| 0.2 callback | 1.0 event | How |
|---|---|---|
| `beforeViewAll`, `beforeShow`, `beforeOpenInfowindow`, `beforeCloseInfowindow` | `selectionChange`, `popupOpen`, `popupClose` | dropped: they ran just before 0.2 acted and couldn't stop it; run the same code on the event that follows the change |
| `afterShow` | `selectionChange` | `{ id }`, undefined when cleared. It doesn't fire for the selection a map starts on: read `getSnapshot().selectedId`. The location itself is `getSnapshot().locations.find((location) => location.id === id)`, or on the element `map.locations`; to show HTML in a panel of yours, keep it in `data` (`html` also opens a popup) and call your `sanitize` on it yourself |
| `afterViewAll` | `selectionChange`, `viewportChange` | the selection cleared (`id` undefined), then the view settled |
| `afterCreateMarker` | — | dropped: an `icon` function, or CSS on `data-selected` / `data-hovered` |
| `afterOpenInfowindow`, `afterCloseInfowindow` | `popupOpen`, `popupClose` | the content is in the DOM; `popupOpen` fires again when an open popup gets new content |
| `afterRoute` | `routeChange` | with legs (each with its steps), distance and duration; again, `result` undefined, when the route is cleared |
| `onPolylineChanged`, `onPolygonChanged` | `locationChange` | the location has the whole `path`, with no point's index |
| `onPolylineClick`, `onPolygonClick` | `selectionChange` | shapes are locations |
| `circleRadiusChanged`, `circleCenterChanged`, `dragEnd` | `locationChange` | with the location and its `previous` value |
| `drag` | `locationEdit` | the geometry so far, never written to the store; its last is where the drag ended |
| `dragStart` | — | dropped: the first `locationEdit` of a drag comes as it starts to move |

### Behaviour that changes

- Locations are identified by `id`, not by their 1-based position.
- Polyline, polygon and route points are no longer list entries; route stops are your own locations and stay visible.
- Changing locations keeps the map where it is; call `fitAll()` to fit them again. A selected id still there stays selected, so with ids from positions it may now be another place: call `select(undefined)` first.
- Clicking the map clears the selection, and so does closing a popup, with the default `openOn: 'click'`. 0.2 kept the selection on a map click, and 1.0 has no option for it. To keep it, select it again on `mapClick`: the popup closes and opens again, `selectionChange` fires twice, and the popup's close button still closes it. A panel of yours needs none of this: it can keep what it shows by ignoring `selectionChange` with no `id`. On the element, `map.maplace` is the store.

  ```js
  let kept;
  maplace.on("selectionChange", ({ id }) => { kept = id; });
  maplace.on("mapClick", () => { if (kept) maplace.select(kept, { pan: false }); });
  ```

- `google.maps` isn't there before your script when Maplace.js loads Google, and never is once you leave it: any `google.maps.*` value in your data or options (`Animation.DROP`, `MapTypeId`) throws `ReferenceError`, and no locations load. Remove them.
- Titles and string content are text. 0.2 inserted titles into the menu as raw HTML.
- No jQuery, and `Maplace` is no longer a constructor: one CDN script sets it as a namespace of functions, or you import ES modules. With the element, Google Maps no longer has to load first (the element adds Google's bootstrap), and the MapLibre script bundles MapLibre; in code, the page loads Maps JS or gives the adapter `apiKey`; from npm it installs maplibre-gl, which the MapLibre script bundles.
- The menu's inline styles are replaced by a stylesheet you can override.
- Bugs and requests from the 0.2 issues (explicit centre overridden by fit, hidden containers, stacking, …) are settled in [RFC §3, decisions from the 0.2 issues](docs/rfc-1.0.md#decisions-from-the-02-issues).
