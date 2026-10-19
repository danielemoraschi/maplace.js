# Store and list view

The store is maplace's headless map state: locations, selection, hover, filter, view and route. It draws nothing itself. An adapter draws it on a map ([Google](google.md)) and list views render it as a list; both ask the store for changes, so the map and the list stay in step.

## Creating a store

`createMaplace(options?)` returns a store. `attach(adapter, container)` connects it to a map:

<!-- example: packages/maplace/examples/simple/vanilla.ts -->
```ts
import { createMaplace } from "maplace";
import { createGoogleAdapter } from "maplace/google";

const maplace = createMaplace({
  locations: [{ id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" }],
});
const container = document.getElementById("simple-vanilla-map") as HTMLElement;
maplace.attach(createGoogleAdapter({ mapId: "DEMO_MAP_ID" }), container);
```

`createMaplace<Data>()` types your own fields: each location's `data`, handed back to content, icon and render functions.

## Options

| Option | Type | What |
|---|---|---|
| `locations` | `Location[]` | The [locations](locations.md) to start with |
| `selectedId` | `string` | The location selected at start; an unknown id throws |
| `sanitize` | `(html) => string` | Makes a location's `html` safe to render; required before any location uses `html` |
| `popup` | [`PopupOptions`](#popup-options) | How popups open and where they sit |
| `style` | `ShapeStyle` | The default [style](locations.md#styles) of circles, polylines and polygons; a location's `style` overrides it |
| `selectedStyle` | `ShapeStyle` | Drawn over `style` while a shape is selected; a location's `selectedStyle` overrides it |
| `hoveredStyle` | `ShapeStyle` | Drawn over `style` while a shape is hovered and not selected |
| `cluster` | `boolean` | Clusters markers; needs the `cluster` capability |
| `view` | `View` | The first view (see below) |

## Popup options

| Option | Type | What |
|---|---|---|
| `maxWidth` | `number` | The popup's maximum width, in pixels |
| `offset` | `[x, y]` | Pixel offset from the anchor. Default `[0, 0]` |
| `openOn` | `"click" \| "hover"` | What opens it. Default `"click"`; with `"click"`, closing it deselects |

A popup follows the selection (or the hover, with `openOn: "hover"`). On a shape it points at a centre point: a circle's centre, the centre of a polygon's bounds, halfway along a polyline.

## The first view

The first view is the `view` option when given, else the selected location, else all locations fitted. Fit padding defaults to 40 px. A fit never zooms in past 15: a box that would need more (one location, or locations metres apart) is centred at 15. Selecting a marker pans to it, and selecting a shape fits it; `select(id, { zoom })`, or a location's own `zoom`, brings either to the point its popup points at, at that zoom; `{ pan: false }` leaves the map where it is.

## Methods

| Method | What |
|---|---|
| `subscribe` | `subscribe(onChange)` calls `onChange` after every change; returns an unsubscribe function. Works with React's `useSyncExternalStore` |
| `getSnapshot` | The current [snapshot](#snapshot) |
| `setLocations` | Replaces all locations; only the differences reach the map. Throws on invalid input |
| `select` | `select(id, options?)` selects a location, or clears the selection with `undefined`; selecting a hidden one throws |
| `hover` | `hover(id)` marks the location under the pointer or keyboard focus, or none with `undefined`; an unknown or hidden id throws, as for `select` |
| `setFilter` | `setFilter(groups)` shows only these groups, or every group with `undefined` |
| `fitAll` | `fitAll(options?)` fits all shown locations; `{ padding }` in pixels |
| `fitBounds` | `fitBounds(bounds, options?)` shows a box; throws when south is above north or a coordinate is out of range |
| `setView` | `setView(center, zoom)` centres the map at a zoom |
| `setRoute` | `setRoute(route)` computes a [route](#routes), or clears it with `undefined` |
| `on` | `on(event, listener, options?)` listens to an [event](#events); returns an unsubscribe function |
| `attach` | `attach(adapter, container)` connects a map provider and starts loading; returns `detach` |
| `whenReady` | Resolves once the provider loaded and the first locations are drawn; rejects on a load error |
| `destroy` | Detaches and drops every listener; later calls that change state throw `destroyed` |

A location counts as updated when its object changes, so reuse unchanged objects: objects reused from the last call are not validated again. A subscriber or listener that throws doesn't stop the others; its error is rethrown in a microtask.

## Snapshot

The snapshot is immutable and replaced on every change, while unchanged parts keep their reference, so a subscriber compares slices cheaply.

| Field | What |
|---|---|
| `locations` | Every location, in data order |
| `selectedId` | The selected location's id, or `undefined` |
| `hoveredId` | The hovered location's id, or `undefined` |
| `filter` | The groups shown, or `undefined` for every group |
| `view` | The last view asked for |
| `viewport` | What the map shows, as the provider reports it; `undefined` until the map is ready |
| `route` | The route asked for, or `undefined` |
| `routeResult` | The computed route: its legs, distance, duration and path; `undefined` until computed |
| `loadState` | `idle` until attached, then `loading`, then `ready` or `error` |

## Events

`on(event, listener)` listens to one event. Each `…Change` event fires after its change, and only when something changed; no event can be cancelled. `on()` returns an unsubscribe function and takes `{ signal }`, an `AbortSignal` that removes the listener.

| Event | Payload | When |
|---|---|---|
| `selectionChange` | `{ id }` | The selection changed, from the map, a list or `select()`; `id` is `undefined` when cleared |
| `hoverChange` | `{ id }` | The pointer or focus moved onto a location, or off it |
| `mapClick` | `{ position }` | A single click on the map itself, not on a location; it clears the selection. A double-click fires nothing |
| `locationEdit` | `{ location, geometry }` | While the user drags or reshapes: the geometry so far, never written to the store |
| `locationChange` | `{ location, previous }` | A drag or edit ended; the store already holds the new value |
| `popupOpen` | `{ id, element }` | A popup opened and its content is in the DOM; again when an open popup gets new content |
| `popupClose` | `{ id }` | A popup closed |
| `viewportChange` | `{ viewport }` | The map settled after a pan or zoom, the user's too, and once it first shows |
| `routeChange` | `{ result }` | A route was computed, or cleared (`result` `undefined`) |
| `error` | `{ error }` | A runtime failure: loading, the key, a route ([codes](api.md#runtime-failures)); or an `icon`, `content` or `sanitize` of yours failing while the map draws, as `invalid-input` |

On the element the same events are DOM events ([the element's events](element.md#events)); in React, `on<Event>` props ([event props](react.md#event-props)).

## Routes

A route is one path through your own locations, in order; it needs the `route` capability.

| Field | Type | What |
|---|---|---|
| `stops` | `string[]` | Location ids, from 2 to the adapter's `routeStopLimit` (27 on Google) |
| `via` | `string[]` | Inner stops the route passes through without ending a leg |
| `travelMode` | `"driving" \| "walking" \| "bicycling" \| "transit"` | Driving when left out |
| `style` | `LineStyle` | How the route's line is drawn |

The result, `routeResult` and `routeChange`'s `result`, has `legs` (each `from`, `to`, its distance and duration, and its turn-by-turn `steps`), the total `distanceMeters` and `durationSeconds`, and the `path`. A route is computed only when its stops, `via`, their positions or the travel mode change, since each computation is billed; a change of `style` alone redraws the line. On Google: [routes](google.md#routes).

## List view options

`createListView(maplace, options?)` renders the store's locations as a list or a native select, in step with it both ways: it returns a `ListView`, `{ element, destroy }`. Place `element` in the page, or on the map with an adapter's `mountControl`; `destroy()` stops it following the store and removes it.

| Option | Type | What |
|---|---|---|
| `as` | `"list" \| "select"` | A listbox (default) or a native `<select>` |
| `groupHeadings` | `boolean` | Shows group headings; default `true` when any location has a `group` |
| `fitAllLabel` | `string` | Adds a first entry with this label that clears the selection and fits all locations |
| `label` | `string` | The list's accessible name; default the `heading`, else "Locations" |
| `heading` | `string` | A visible heading above the entries |
| `render` | `(entry) => Node` | An entry's content, for `as: "list"` only; the view keeps keyboard, focus and ARIA handling |

The list sets the store's hover from the pointer and keyboard focus, so the map highlights what the list points at; hover never moves the map. Its default styles put every selector in `:where()`, so any rule of the page wins.

## Listed locations

`listedLocations(snapshot)` returns what the lists list, in data order: the locations shown under the filter, without those with `listed: false`. A list of your own built from it lists the same as maplace's.

## Adapters

An adapter is the bridge to a map provider; the store drives it, and it reports back through its host. Writing one is for a new provider: the contract is in [RFC §3 Shape](../rfc-1.0.md#shape).
