# Store and list view

The store is maplacejs's headless map state: locations, selection, hover, filter, view and route. It draws nothing itself. An adapter draws it on a map ([Google](google.md) or [MapLibre](maplibre.md)) and list views render it as a list; both ask the store for changes, so the map and the list stay in step.

## Creating a store

`createMaplace(options?)` returns a store. `attach(adapter, container)` connects it to a map, `container` being an element or a selector the page matches (one matching nothing is `invalid-input`; an element in a shadow root is passed as the element). On Google, [`createGoogleMap`](google.md#creategooglemap) does both in one call, and on MapLibre [`createMapLibreMap`](maplibre.md#createmaplibremap):

<!-- example: packages/maplace/examples/simple/vanilla.ts -->
```ts
import { createGoogleMap } from "maplace/google";

createGoogleMap("#simple-vanilla-map", {
  locations: [{ id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" }],
});
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
| `cluster` | `boolean` | Clusters markers; needs the `cluster` capability; badges styled as [cluster badges](styling.md#cluster-badges) |
| `view` | `View` | The first view (see below) |

## Popup options

| Option | Type | What |
|---|---|---|
| `maxWidth` | `number` | The popup's maximum width, in pixels |
| `offset` | `[x, y]` | Pixel offset from the anchor. Default `[0, 0]` |
| `openOn` | `"click" \| "hover"` | What opens it. Default `"click"`; with `"click"`, closing it deselects |

A popup follows the selection (or the hover, with `openOn: "hover"`). On a shape it points at a centre point: a circle's centre, the centre of a polygon's bounds, halfway along a polyline. A touch hovers no list entry and no DOM marker (every Google marker, and MapLibre's with an icon or `editable`), so with `openOn: "hover"` a tap opens no popup on them; MapLibre's pins and shapes can still be hovered by the mouse events a browser sends after a tap.

## The first view

The first view is the `view` option when given, else the selected location (at its own `zoom`; a marker without one is centred at 15, a shape fitted), else all locations fitted, with 40 px of padding, as `fitAll` and `fitBounds` use by default. A fit never zooms in past 15: a box that would need more (one location, or locations metres apart) is centred at 15.

`view` is one of four shapes, every field required:

- `{ kind: "center", center, zoom }`: centred at `center`, a `{ lat, lng }`, at `zoom`.
- `{ kind: "fit-all", padding }`: every shown location fitted, `padding` in pixels.
- `{ kind: "fit-bounds", bounds, padding }`: a box fitted, `bounds` a `{ south, west, north, east }`.
- `{ kind: "location", id, zoom }`: one location, by a known `id`, brought into view, not selected, at `zoom`; with `zoom: undefined`, as the selected location is.

```ts
createMaplace({
  locations,
  view: { kind: "center", center: { lat: 41.9, lng: 12.5 }, zoom: 6 },
});
```

Once the map is open, selecting a marker pans to it at the map's zoom, and selecting a shape fits it; `select(id, { zoom })`, or a location's own `zoom`, brings either to the point its popup points at, at that zoom; `{ pan: false }` leaves the map where it is.

## Methods

| Method | What |
|---|---|
| `subscribe` | `subscribe(onChange)` calls `onChange` after every change; returns an unsubscribe function. Works with React's `useSyncExternalStore` |
| `getSnapshot` | The current [snapshot](#snapshot) |
| `setLocations` | Replaces all locations; only the differences reach the map. Throws on invalid input |
| `select` | `select(id, options?)` selects a location, or clears the selection with `undefined`; selecting a hidden one throws. `{ zoom }` shows it at that zoom, `{ pan: false }` leaves the map where it is (not both): [the first view](#the-first-view) |
| `hover` | `hover(id)` marks the location under the pointer or keyboard focus, or none with `undefined`; an unknown or hidden id throws, as for `select` |
| `setFilter` | `setFilter(["North"])` shows only these groups; `setFilter({ groups, tags, query })` what is in any of the groups, has all of the tags and every word of the query in its name (its title, else its id), group or `searchText`, ignoring case and accents (Ł, ø and Đ are letters of their own), all that are given; `undefined` shows everything. It replaces the whole filter, so spread `getSnapshot().filter` to change one part. A location without a group, or without tags, hides while those are asked for. `{ tags: [] }` and a blank query ask for nothing, so a page can pass its ticked boxes as they are; `[]` or `{ groups: [] }` hides everything. Hiding the selected location deselects it. It applies at once and the map redraws, so a box of your own calls it when typing pauses, as the list's search box does |
| `fitAll` | `fitAll(options?)` fits all shown locations; `{ padding }` in pixels |
| `fitBounds` | `fitBounds(bounds, options?)` shows a box; throws when south is above north or a coordinate is out of range |
| `setView` | `setView(center, zoom)` centres the map at a zoom |
| `setRoute` | `setRoute(route)` computes a [route](#routes), or clears it with `undefined` |
| `on` | `on(event, listener, options?)` listens to an [event](#events); returns an unsubscribe function |
| `attach` | `attach(adapter, container)` connects a map provider in `container`, an element or a selector, and starts loading; returns `detach` |
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
| `filter` | What `setFilter` asked for, always as `{ groups, tags, query }`, or `undefined` for everything |
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
| `hoverChange` | `{ id }` | The pointer or focus moved onto a location, or off it; a touch hovers no list entry or DOM marker ([Popup options](#popup-options)) |
| `mapClick` | `{ position }` | A single click on the map itself, not on a location; it clears the selection. A double-click fires nothing |
| `locationEdit` | `{ location, geometry }` | While the user drags or reshapes: the geometry so far, never written to the store; a drag the page ends (the location removed, `editable` off) is cut short, with no `locationChange` |
| `locationChange` | `{ location, previous }` | A drag or edit ended; the store already holds the new value |
| `popupOpen` | `{ id, element }` | A popup opened and its content is in the DOM; again when an open popup gets new content |
| `popupClose` | `{ id }` | A popup closed |
| `viewportChange` | `{ viewport }` | The map settled after a pan or zoom, the user's too, and once it first shows |
| `routeChange` | `{ result }` | A route was computed, or cleared (`result` `undefined`) |
| `error` | `{ error }` | A runtime failure: loading, the key, a route ([codes](api.md#runtime-failures)); or an `icon`, `content` or `sanitize` of yours failing while the map draws, as `invalid-input` |

On the element the same events are DOM events ([the element's events](element.md#events)); in React, `on<Event>` props ([event props](react.md#event-props)).

## Routes

A route is one path through your own locations, in order; it needs the `route` capability, which Google has and MapLibre lacks ([routes](maplibre.md#routes)).

| Field | Type | What |
|---|---|---|
| `stops` | `string[]` | Location ids, from 2 to the adapter's `routeStopLimit` (27 on Google) |
| `via` | `string[]` | Inner stops the route passes through without ending a leg |
| `travelMode` | `"driving" \| "walking" \| "bicycling" \| "transit"` | Driving when left out |
| `avoid` | `("tolls" \| "highways" \| "ferries")[]` | What the route keeps off where it reasonably can, in any order; on Google, driving routes only ([routes](google.md#routes)) |
| `style` | `LineStyle` | How the route's line is drawn |

The result, `routeResult` and `routeChange`'s `result`, has `legs` (each `from`, `to`, its distance and duration, and its turn-by-turn `steps`), the total `distanceMeters` and `durationSeconds`, and the `path`. A route is computed only when its stops, `via`, their positions, the travel mode or `avoid` change, since each computation is billed (the same things avoided in another order are no change); a change of `style` alone redraws the line. On Google: [routes](google.md#routes).

## List view options

`createListView(maplace, options?)` renders the store's locations as a list or a native select, in step with it both ways: it returns a `ListView`, `{ element, destroy }`. Place `element` in the page, or on the map with an adapter's `mountControl`; `destroy()` stops it following the store and removes it.

| Option | Type | What |
|---|---|---|
| `as` | `"list" \| "select"` | A listbox (default) or a native `<select>` |
| `groupHeadings` | `boolean` | Shows group headings; default `true` when any location has a `group` |
| `groupCounts` | `boolean` | After each group heading, how many are listed under it now, following the filter and `scope`: "North (3)". Off by default; refused with `groupHeadings: false` |
| `fitAllLabel` | `string` | Adds a first entry with this label that clears the selection and fits all locations |
| `label` | `string` | The list's accessible name; default the `heading`, else "Locations" |
| `heading` | `string` | A visible heading above the entries |
| `render` | `(entry) => Node` | An entry's content, for `as: "list"` only; the view keeps keyboard, focus and ARIA handling |
| `scope` | `"viewport"` | A switch above the list, "All" or "This area", which lists only the locations in the map's view and follows it; for `as: "list"` only |
| `areaOnlyLabel` | `string` | The label of the switch's "This area"; default "This area" |
| `showAllLabel` | `string` | The label of the switch's "All"; default "All" |
| `emptyAreaLabel` | `string` | What a scoped list says when nothing is in its view; default "No locations in this area" |
| `searchLabel` | `string` | Shows a search box above the entries, named by this; for `as: "list"` only |
| `noMatchesLabel` | `string` | What the box's status says when nothing matches; default "No locations match" |
| `matchesLabel` | `string` | What its status says before the count while a query is on; default "Locations found", as "Locations found: 3" |

With `scope: "viewport"` the list shows a switch above its entries, always: two buttons, "All" and "This area", the one in use pressed (`aria-pressed`), in a group named as the list (its `label`, else its `heading`, else "Locations"). "All", at load, lists every location. "This area" lists the locations in the map's view (a marker or circle when its point or centre is in it, a line or polygon when any point of its path is) and follows the map: each new view lists again, as does a change of locations or filter. A resize or a rotation, which keeps the centre and zoom, isn't a new view, so a list under the map, whose height resizes it, can't loop. With no view (not attached, not laid out, reopened) "This area" stays chosen and lists everything until a view comes. A view holding nothing keeps the switch, and a status (`role="status"`, always on the page, so a screen reader hears it) says so (`emptyAreaLabel`). Nothing hides, so focus stays on the button pressed, and focus on an entry the list leaves out when it empties goes to it. It works wherever the list is: on the map, beside or under it, in a container of your own, or a `<LocationList>` outside the `<MaplaceMap>`.

With `searchLabel`, typing sets the filter's `query` once it pauses for 150 ms, and keeps the rest of the filter, so the map narrows with the list; the camera stays, and choosing an entry pans to it. The box follows the store: a page's `setFilter` without a query empties it, so a page with its own controls too spreads `getSnapshot().filter`. A query outlives the box, and a location it hides can't be selected, as for any filter: a page's own `select` throws, so check `listedLocations(getSnapshot())` or clear the query first. A `listed: false` location that matches stays on the map, while the status counts only the list. With a `scope`, a match outside "This area" leaves the empty-area status to speak.

The list sets the store's hover from the pointer and keyboard focus, so the map highlights what the list points at; hover never moves the map. Its default styles put every selector in `:where()`, so any rule of the page wins; its element carries `maplace-list-view`, and [Styling](styling.md) lists its classes and how to turn the defaults off.

## Listed locations

`listedLocations(snapshot)` returns what the lists list, in data order: the locations shown under the filter, without those with `listed: false`. A list of your own built from it lists the same as maplacejs's. The map's view never narrows it: a list with `scope` narrows them to its view in "This area".

## Adapters

An adapter is the bridge to a map provider; the store drives it, and it reports back through its host. Writing one is for a new provider: the contract is in [RFC §3 Shape](../rfc-1.0.md#shape).

Every adapter puts a node of yours on its map with `mountControl(node, position)`, in a corner (`"top-left"`, `"top-right"`, `"bottom-left"` or `"bottom-right"`), even before the map opens. The node is moved, never changed, and its keys, wheel and drags never move the map. It returns a function that takes the node off, safe to call twice; destroying the adapter takes every control off. maplacejs's own lists on the map go there the same way.
