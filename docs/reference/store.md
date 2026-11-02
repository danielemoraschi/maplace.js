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
| `popup` | [`PopupOptions`](#popup-options) | How popups open, where they sit, and the links at their end |
| `style` | `ShapeStyle` | The default [style](locations.md#styles) of circles, polylines and polygons; a location's `style` overrides it |
| `selectedStyle` | `ShapeStyle` | Drawn over `style` while a shape is selected; a location's `selectedStyle` overrides it |
| `hoveredStyle` | `ShapeStyle` | Drawn over `style` while a shape is hovered and not selected |
| `cluster` | `boolean` | Clusters markers; needs the `cluster` capability; badges styled as [cluster badges](styling.md#cluster-badges) |
| `view` | `View` | The first view (see below) |
| `skipMapLabel` | `string` | The words of the [link past the map](#on-every-map); default "Skip the map" |
| `selectedLabel` | `string` | Said before a selected location's name, "Selected: Rome"; default "Selected" |

## Popup options

| Option | Type | What |
|---|---|---|
| `maxWidth` | `number` | The popup's maximum width, in pixels |
| `offset` | `[x, y]` | Pixel offset from the anchor. Default `[0, 0]` |
| `openOn` | `"click" \| "hover"` | What opens it. Default `"click"`; with `"click"`, closing it deselects |
| `openInMapsLink` | `boolean` | Adds a link at the end of a popup, to the location on the provider's maps site: Google Maps on Google, OpenStreetMap on MapLibre |
| `openInMapsLabel` | `string` | The words of the link to the provider's maps site; default "Open in Maps"; does nothing without `openInMapsLink` |
| `directionsLink` | `boolean` | Adds a link at the end of a popup, to directions to the location, from wherever the site starts: Google Maps on Google, OpenStreetMap on MapLibre |
| `directionsLabel` | `string` | The words of the link to directions; default "Directions"; does nothing without `directionsLink` |

A popup follows the selection (or the hover, with `openOn: "hover"`). On a shape it points at a centre point: a circle's centre, the centre of a polygon's bounds, halfway along a polyline. A touch hovers no list entry and no DOM marker (every Google marker, and MapLibre's with an icon or `editable`), so with `openOn: "hover"` a tap opens no popup on them; MapLibre's pins and shapes can still be hovered by the mouse events a browser sends after a tap.

Each link goes to the point the popup points at, as coordinates, opens in a new tab and sends no referrer: nothing loads until it is clicked, and no key or billing is involved. They end the element `popupOpen` gives, after the content. A location with no content has no popup, so no link. With `openOn: "hover"` a link is `invalid-input`: a pointer can't reach a link that closes as it leaves. An adapter of your own ([Adapters](#adapters)) draws its own from `popup`.

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
| `setOrigin` | `setOrigin(point)` sets the point [distances](#distances) are measured from, any point on the map, or clears it with `undefined`; the map draws a dot there |
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
| `origin` | The point distances are measured from (`setOrigin`); `undefined` until one is set |
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
| `fitAll` | `boolean` | Adds a first entry to the list, which clears the selection and fits all locations. On a select, the entry shows only while nothing is selected and all locations are fitted; otherwise no option shows, so the entry can be chosen. A map panned under the fit still shows it, and choosing it then does nothing. |
| `fitAllLabel` | `string` | The words of the list's first entry, which clears the selection and fits all locations; default "All locations"; does nothing without `fitAll` |
| `label` | `string` | The list's accessible name; default the `heading`, else "Locations" |
| `heading` | `string` | A visible heading above the entries |
| `render` | `(entry) => Node` | An entry's content, for `as: "list"` only; the view keeps keyboard, focus and ARIA handling |
| `scope` | `"viewport"` | A switch above the list, "All" or "This area", which lists only the locations in the map's view and follows it; for `as: "list"` only |
| `areaOnlyLabel` | `string` | The words of the `scope` switch's button that lists only the map's view; default "This area" |
| `showAllLabel` | `string` | The words of the `scope` switch's button that lists every location; default "All" |
| `emptyAreaLabel` | `string` | What a list with `scope` says when no location is in the map's view; default "No locations in this area" |
| `sort` | `"distance"` | Once the store has an origin, nearest first, each entry saying how far ([Distances](#distances)) |
| `distanceUnit` | `"kilometer" \| "mile"` | What `sort` writes a distance in; default `kilometer` |
| `search` | `boolean` | Shows a search box above the entries; for `as: "list"` only |
| `searchLabel` | `string` | The search box's placeholder and accessible name; default "Search"; does nothing without `search` |
| `noMatchesLabel` | `string` | What the line under the search box says when nothing matches; default "No locations match" |
| `matchesLabel` | `string` | What the line under the search box says before the count of matches; default "Locations found", as "Locations found: 3" |

A feature with words has a switch of its own, and its label only changes the words: a label without its switch does nothing, though a blank one is still refused.

With `scope: "viewport"` the list shows a switch above its entries, always: two buttons, "All" and "This area", the one in use pressed (`aria-pressed`), in a group named as the list (its `label`, else its `heading`, else "Locations"). "All", at load, lists every location. "This area" lists the locations in the map's view (a marker or circle when its point or centre is in it, a line or polygon when any point of its path is) and follows the map: each new view lists again, as does a change of locations or filter. A resize or a rotation, which keeps the centre and zoom, isn't a new view, so a list under the map, whose height resizes it, can't loop. With no view (not attached, not laid out, reopened) "This area" stays chosen and lists everything until a view comes. A view holding nothing keeps the switch, and a status (`role="status"`, always on the page, so a screen reader hears it) says so (`emptyAreaLabel`). Nothing hides, so focus stays on the button pressed, and focus on an entry the list leaves out when it empties goes to it. It works wherever the list is: on the map, beside or under it, in a container of your own, or a `<LocationList>` outside the `<MaplaceMap>`.

With `search`, typing sets the filter's `query` once it pauses for 150 ms, and keeps the rest of the filter, so the map narrows with the list; the camera stays, and choosing an entry pans to it. The box follows the store: a page's `setFilter` without a query empties it, so a page with its own controls too spreads `getSnapshot().filter`. A query outlives the box, and a location it hides can't be selected, as for any filter: a page's own `select` throws, so check `listedLocations(getSnapshot())` or clear the query first. A `listed: false` location that matches stays on the map, while the status counts only the list. With a `scope`, a match outside "This area" leaves the empty-area status to speak.

The list sets the store's hover from the pointer and keyboard focus, so the map highlights what the list points at; hover never moves the map. Its default styles put every selector in `:where()`, so any rule of the page wins; its element carries `maplace-list-view`, and [Styling](styling.md) lists its classes and how to turn the defaults off.

## Distances

A list with `sort: "distance"` lists nearest first once there is an origin, after the filter and `scope` have narrowed it, ties in data order. With no origin, or once it is cleared, it is back in data order, with no distances. Focus stays on its entry through a sort, and a new origin scrolls the list to its top unless focus is in it.

- **The distance** is a straight line on the sphere, with no provider service or quota. A shape is measured to the point its popup points at: a circle's centre, the centre of a polygon's bounds, halfway along a line. So a visitor inside a big polygon reads the distance to its centre.
- **Groups** keep their rule: within each group nearest first, groups in the order of their nearest member, ungrouped entries first.
- **The words** are two significant figures in the browser's language: "0.85 km", "12 km", "1,200 km". A `render` gets `distance` (metres) and `distanceLabel`, and shows either.
- **`distanceTo(origin, location)`** gives the metres, for a page's own list; `listedLocations` stays in data order. An origin that isn't a point is `invalid-input`.
- **Any point** can be the origin. A click: `map.on("mapClick", ({ position }) => map.setOrigin(position))`. A location: `map.setOrigin({ lat: rome.lat, lng: rome.lng })`. An address a visitor types: [your own form](locations.md#a-visitors-address).

### The "My location" control

`createMyLocationControl(maplace, { label, unavailableLabel })` returns `{ element, destroy }`, a view like a list view: put `element` on the map with `mountControl` or anywhere in the page. `createGoogleMap` and `createMapLibreMap` take it as `myLocation`, the element as `my-location`, React as `<MyLocation>`.

It is a toggle button, "My location" by default. Pressed, it asks the browser for the position, once, then makes it the origin and centres the map there at its zoom (with no view yet it moves nothing). Pressed again, it clears the origin. Nothing is asked until a press. An origin your page set shows it unpressed, and a press replaces it.

Refused, unavailable, timed out, not on HTTPS, or no geolocation at all: the line under the button says `unavailableLabel`, "Location unavailable" by default, and any origin already there stands. That isn't an event or an error: it is the visitor's choice or the device's, not a failure of the page. [Setup](setup.md#the-visitors-location) says what a page needs.

## Listed locations

`listedLocations(snapshot)` returns what the lists list, in data order: the locations shown under the filter, without those with `listed: false`. A list of your own built from it lists the same as maplacejs's. The map's view never narrows it: a list with `scope` narrows them to its view in "This area".

## On every map

Once a map has mounted, `attach` adds two things to its container, for a keyboard and a screen reader, whichever provider draws it; `detach` takes them away.

- **A link past the map**, first in the container, so Tab reaches it before the map's own stops; hidden until focused. It sends focus to the first thing that takes it in a control on the map, such as a list there, else just past the map, so the next Tab goes on to what follows. `.maplace-skip-map` styles its look, though its place and stacking are set on it; `display: none` removes it.
- **A live region** saying each new selection, by the location's title, else its id: "Selected: Rome". It stays silent on the selection the map opens with, when a selection is cleared, and while focus is in a native `select`, as a screen reader speaks the change there.

## Adapters

An adapter is the bridge to a map provider; the store drives it, and it reports back through its host. Writing one is for a new provider: the contract is in [RFC §3 Shape](../rfc-1.0.md#shape). Its container also holds [what `attach` adds](#on-every-map) once `mount` resolves, so an adapter leaves other nodes there alone.

Every adapter puts a node of yours on its map with `mountControl(node, position)`, in a corner (`"top-left"`, `"top-right"`, `"bottom-left"` or `"bottom-right"`, the same corner on a right-to-left page), even before the map opens. The node is moved, never changed, and its keys, wheel and drags never move the map. It returns a function that takes the node off, safe to call twice; destroying the adapter takes every control off. maplacejs's own lists on the map go there the same way. The element gives no adapter: [a list view of yours](element.md#list-views) puts a control on the map instead.

### Proving an adapter

`maplace/testing` runs the suite maplacejs's own adapters pass on yours, so a provider of your own can show it keeps the contract. It runs in [Vitest's browser mode](https://vitest.dev/guide/browser/), in a real browser, with `vitest` (tested on 5) and a browser provider such as `@vitest/browser-playwright` installed, and its browser (`npx playwright install chromium`); no page loads it, and it's built apart from the other entries, so it adds nothing to them.

`describeConformance(subject)` registers the checks. A subject has a `name` and a `create(container)` returning `{ adapter, probe }`:

- **`create`** returns a new adapter on each call, synchronously. The suite also calls it with a detached element, as the checks register, to read the adapter's capabilities, and never mounts that one: load your provider in `mount`, not here. A subject drawing on a page's own map makes that map only when `container.isConnected`.
- **`probe`** is a `MapProbe`, the only per-provider code the suite needs. It reads your provider's map (`location`, `locationIds`, `stackOrder`, `shownPopup`, `originDot`) and acts as a user would (`click`, `clickMap`, `pointerOver`, `pointerOut`, `drag`, `closePopup`). `settle()` resolves once the map has finished what it started and reported it. `frontFirst` is `stackOrder`'s rule: markers above shapes, each front first.
- **`groups`** joins the suite part by part: `declarations`, `lifecycle`, `drawing`, `presentation`, `popups`, `camera`, `container`, `reports`, `editing`, `route`, `cluster`, `controls` and `origin`. A group left out shows as skipped, and a capability your adapter doesn't declare skips its checks.
- **`provedOn`** is for a second subject of one adapter, such as one on a page's own map: the `groups` its `subject` already proves, which then show as skipped.

The maps are drawn at 512×512, and zoom means what it does on the web: a world 256 px wide at zoom 0. A check compares what your map draws with `SELECTED_LOOK` and `SELECTED_LINE_LOOK` for a selected shape and `HOVERED_LOOK` for one pointed at, and looks for `ORIGIN_DOT_CLASS` on the origin's dot. A real map may need a longer `testTimeout`: maplacejs's own use 60 seconds.

This one draws nothing, so it joins only the first group:

<!-- example: scripts/checks/consumer/testing.ts -->
```ts
// An adapter of your own, proved with maplace/testing: run in Vitest's browser mode. This one
// draws nothing, so it joins only the suite's first group; yours adds each as it draws that part,
// and its probe reads and drives your provider's map.
import type { Adapter } from "maplace";
import type { ConformanceSubject, MapProbe } from "maplace/testing";

function createMyAdapter(): Adapter {
  return {
    capabilities: new Set(["circle"]),
    async mount() {},
    async apply() {},
    present() {},
    setView() {},
    setRoute() {},
    mountControl() {
      return () => {};
    },
    destroy() {},
  };
}

const myProbe: MapProbe = {
  location: () => undefined,
  locationIds: () => [],
  stackOrder: () => [],
  shownPopup: () => undefined,
  originDot: () => undefined,
  click() {},
  clickMap() {},
  pointerOver() {},
  pointerOut() {},
  drag() {},
  closePopup() {},
  settle: async () => {},
};

export const myAdapter: ConformanceSubject = {
  name: "my adapter",
  groups: ["declarations"],
  create: () => ({ adapter: createMyAdapter(), probe: myProbe }),
};
```

A test file then calls `describeConformance(myAdapter)`, in a config like this, whose `include` names that file:

<!-- example: scripts/checks/consumer/kit-run/vitest.config.ts -->
```ts
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["kit-run/adapter-run.ts"],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      // Wider than the 512×512 the suite draws at, or its maps overflow the frame.
      instances: [{ browser: "chromium", viewport: { width: 1024, height: 768 } }],
    },
  },
});
```
