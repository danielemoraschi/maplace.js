# React

`maplace/react` is the store as React components: a provider that makes one store for its children, a map, a list, controls on the map and a hook. It needs `react` and `react-dom` 19. Nothing touches the DOM on import or on a server render.

<!-- example: packages/maplace/examples/simple/react.tsx -->
```tsx
import type { Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { MaplaceMap, MaplaceProvider } from "maplace/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const rome: Location[] = [{ id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" }];

function Simple() {
  return (
    <MaplaceProvider locations={rome}>
      <MaplaceMap createAdapter={createGoogleAdapter} className="map" />
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("simple-react-root") as HTMLElement).render(
  <StrictMode>
    <Simple />
  </StrictMode>,
);
```

## `<MaplaceProvider>`

Makes one store on mount and keeps it as long as it is mounted. `locations` and the controlled props follow later renders; the store's other options are read once, on mount, so inline objects and functions cost nothing.

| Prop | What |
|---|---|
| `locations` | Required. Applied again when the array changes, never otherwise, so an edit on the map outlives a render |
| `selectedId` | A [controlled selection](#controlled-selection) |
| `defaultSelectedId` | The selection at start, when `selectedId` is not controlled |
| `filter` | The groups shown; applied when its value changes |
| `route` | The [route](store.md#routes); applied when its value changes, so it is computed, and billed, once per change |
| `sanitize`, `popup`, `style`, `selectedStyle`, `hoveredStyle`, `cluster`, `view` | The [store's options](store.md#options), read on mount |
| `children` | What uses the store: `<MaplaceMap>`, `<LocationList>`, your components |

An id in `selectedId` or `defaultSelectedId` not shown yet (locations still loading, or filtered out) waits until it is. A `filter` or `route` that app code sets through the store stands until the prop next changes.

## Event props

One prop per [store event](store.md#events), its listener.

| Prop | Event |
|---|---|
| `onSelectionChange` | `selectionChange` |
| `onHoverChange` | `hoverChange` |
| `onMapClick` | `mapClick` |
| `onLocationEdit` | `locationEdit` |
| `onLocationChange` | `locationChange` |
| `onPopupOpen` | `popupOpen` |
| `onPopupClose` | `popupClose` |
| `onViewportChange` | `viewportChange` |
| `onRouteChange` | `routeChange` |
| `onError` | `error` |

## Controlled selection

With a `selectedId` prop (present, `undefined` meaning nothing selected), the prop is the selection. A selection the user or app code makes calls `onSelectionChange`, and unless the parent passes it back in that render, the store goes back to the prop (and pans back); so `onSelectionChange` sets state synchronously. Changes the prop makes call nothing. Switching `selectedId` between controlled and not after mount, or giving both `selectedId` and `defaultSelectedId`, is `invalid-input`.

## `<MaplaceMap>`

Renders a div you size and attaches a fresh adapter to it on mount, detaching on unmount, so StrictMode and `<Activity>` work.

| Prop | What |
|---|---|
| `createAdapter` | Required. Called once per mount: an adapter drives one map. `createGoogleAdapter`, `createMapLibreAdapter` ([MapLibre](maplibre.md#react)), or a function making one with options |
| `className` | Size the map through it: a map fills its container |
| `popupContent` | `(location) => ReactNode`: a popup's content as React content |
| `markerIcon` | `(location, state) => ReactNode`: a marker's icon as React content |
| `children` | What goes on the map: `<MapControl>`s and `<LocationList position>`s, rendered beside the map's div, never in it |

`popupContent` and `markerIcon` render through a portal into one host per location (an icon's host carries `data-selected` and `data-hovered`, as core icons do), with the provider's context, keeping their state. Returning nothing (`null`, `undefined`, a boolean) leaves the location's own `content` or `icon`. Whether either is given is read on mount. Content that throws is an `invalid-input` error event naming the field, and renders nothing.

## `<LocationList>`

The store's [list view](store.md#list-view-options). A change of an option builds it again.

| Prop | What |
|---|---|
| `as` | `"list"` (a listbox, the default) or `"select"` (a native select) |
| `groupHeadings` | Shows group headings; default `true` when any location has a `group` |
| `fitAllLabel` | Adds a first entry with this label that clears the selection and fits all locations |
| `label` | The list's accessible name; default the `heading`, else "Locations" |
| `heading` | A visible heading above the entries |
| `scope` | `"viewport"`: lists only the locations in the map's view, from a "Search this area" button ([List view options](store.md#list-view-options)); for `as: "list"` only |
| `searchAreaLabel` | That button's label; default "Search this area" |
| `emptyAreaLabel` | What a scoped list says when nothing is in its view; default "No locations in this area" |
| `children` | For `as: "list"`, a function rendering an entry's content: plain content, since the entry itself is the option |
| `position` | A corner, inside a `<MaplaceMap>`: the list itself goes on the map there while the map is attached, as the element's `list-position`, so its panel hides with it and its entries scroll under its heading. Without a `<MaplaceMap>` it is misuse |

## `<MapControl>`

Inside a `<MaplaceMap>`, puts its children on the map in a corner, through the adapter's `mountControl`, while the map is attached. They keep the provider's context, and show as the page gives them: for the page's own content. Maplace's list goes on the map with [`<LocationList position>`](#locationlist). Outside a `<MaplaceMap>` it is misuse; on a server it renders nothing.

| Prop | What |
|---|---|
| `position` | The corner: `"top-left"`, `"top-right"`, `"bottom-left"` or `"bottom-right"` |
| `children` | What goes on the map |

## `useMaplace()`

Returns the store of the nearest `<MaplaceProvider>`, to call its [methods](store.md#methods) or to read its state with `useSyncExternalStore(store.subscribe, store.getSnapshot)`. Misuse throws from render or a layout effect, to the nearest error boundary.

## Server components

The entry starts with `"use client"`, so in React Server Components it is a client boundary. A server component renders `<MaplaceProvider>` and `<LocationList>` with data (`locations`, `defaultSelectedId`, `filter`, `route`, the list's options). What takes a function (`createAdapter`, `on<Event>` props, `popupContent`, `markerIcon`, a list's `children`) goes in a client component of yours, as does a controlled `selectedId`, which needs its `onSelectionChange`. [Getting started, with React](../../README.md#with-react) has the two files.
