# API reference

Every export of every entry, with where it is explained, then the error codes and the capabilities. One package, one version for all entries; the package is ES modules only.

## `maplace`

The store, the list view, the adapter contract and the types. Side-effect-free.

| Export | Kind | Explained in |
|---|---|---|
| `createMaplace` | function | [Creating a store](store.md#creating-a-store) |
| `MaplaceOptions` | type | [Store options](store.md#options) |
| `Maplace` | type | [Methods](store.md#methods) |
| `Snapshot`, `LoadState` | types | [Snapshot](store.md#snapshot) |
| `PopupOptions` | type | [Popup options](store.md#popup-options) |
| `View`, `Viewport`, `Bounds`, `FitOptions`, `SelectOptions` | types | [The first view](store.md#the-first-view), [methods](store.md#methods) |
| `MaplaceEvents`, `MaplaceEventName`, `Listener`, `ListenOptions`, `Unsubscribe` | types | [Events](store.md#events) |
| `Route`, `RouteResult`, `RouteLeg`, `RouteStep`, `TravelMode` | types | [Routes](store.md#routes) |
| `createListView` | function | [List view options](store.md#list-view-options) |
| `ListViewOptions`, `ListView`, `ListEntry` | types | [List view options](store.md#list-view-options) |
| `listedLocations` | function | [Listed locations](store.md#listed-locations) |
| `Location`, `MarkerLocation`, `CircleLocation`, `PolylineLocation`, `PolygonLocation` | types | [Locations](locations.md) |
| `LatLng`, `Geometry`, `MarkerGeometry`, `CircleGeometry`, `PolylineGeometry`, `PolygonGeometry` | types | [Locations](locations.md#markers); a geometry is what a drag or edit changes |
| `Content` | type | [Content](locations.md#content) |
| `Icon`, `LocationState` | types | [Icons](locations.md#icons) |
| `LineStyle`, `ShapeStyle` | types | [Styles](locations.md#styles) |
| `MaplaceError`, `MaplaceErrorDetails` | class, type | [Errors](#errors) |
| `ErrorCode`, `MisuseCode`, `RuntimeCode` | types | [Misuse codes](#misuse-codes), [runtime failures](#runtime-failures) |
| `Capability` | type | [Capabilities](#capabilities) |
| `ControlPosition` | type | A corner of the map: [`<MapControl>`](react.md#mapcontrol), [`<LocationList>`](react.md#locationlist)'s `position` |
| `Adapter`, `AdapterHost`, `MountContext`, `LocationDiff`, `PresentationState`, `Drawable`, `ResolvedPopupOptions`, `ResolvedView` | types | The adapter contract, for a new provider: [RFC §3 Shape](../rfc-1.0.md#shape) |

## `maplace/google`

The Google Maps adapter: the only entry that knows `google.maps`.

| Export | Kind | Explained in |
|---|---|---|
| `createGoogleAdapter` | function | [Google adapter](google.md) |
| `GoogleAdapterOptions` | type | [Options](google.md#options) |
| `createGoogleMap` | function | [`createGoogleMap`](google.md#creategooglemap) |
| `GoogleMapOptions`, `GoogleMapList` | types | [`createGoogleMap`](google.md#creategooglemap) |

## `maplace/maplibre`

The MapLibre GL JS adapter, on OpenFreeMap's tiles unless a style says otherwise: the only entry that knows `maplibre-gl`, which the page installs, with its stylesheet.

| Export | Kind | Explained in |
|---|---|---|
| `createMapLibreAdapter` | function | [MapLibre adapter](maplibre.md) |
| `MapLibreAdapterOptions` | type | [Options](maplibre.md#options) |
| `createMapLibreMap` | function | [`createMapLibreMap`](maplibre.md#createmaplibremap) |
| `MapLibreMapOptions`, `MapLibreMapList` | types | [`createMapLibreMap`](maplibre.md#createmaplibremap) |

## `maplace/element`

`<maplace-map>` and `<maplace-location>`, defined on import, with no provider registered.

| Export | Kind | Explained in |
|---|---|---|
| `defineProvider`, `ProviderFactory` | function, type | [Providers](element.md#providers) |
| `defineListView`, `ListViewFactory`, `ListViewSetup`, `ElementListOptions` | function, types | [List views](element.md#list-views) |
| `ListPosition` | type | [Map attributes](element.md#map-attributes): `list-position` |
| `MaplaceMapElement` | type | [Properties and methods](element.md#properties-and-methods) |
| `MaplaceLocationElement` | type | [Location attributes](element.md#location-attributes) |
| `MaplaceElementEventMap` | type | [Events](element.md#events) |

## `maplace/element/google`

The element with the Google provider registered; the Google CDN scripts are this entry bundled.

| Export | Kind | Explained in |
|---|---|---|
| `MaplaceMapElement` | type | [Properties and methods](element.md#properties-and-methods), [provider attributes](google.md#provider-attributes) |

## `maplace/element/maplibre`

The element with the MapLibre provider registered; the MapLibre CDN script is this entry bundled, with maplibre-gl.

| Export | Kind | Explained in |
|---|---|---|
| `MaplaceMapElement` | type | [Properties and methods](element.md#properties-and-methods), [provider attributes](maplibre.md#provider-attributes) |

## The CDN scripts' `Maplace`

Each CDN script also sets one global, `Maplace`: the exports of `maplace`, `maplace/element` and its provider's entry above, so a page's own script calls `Maplace.createGoogleMap(...)` where an npm page imports `createGoogleMap`. The MapLibre script adds `Maplace.maplibre`, the maplibre-gl it bundles. It holds functions, no state: the store a page makes is its own ([with a script of your own](setup.md#with-a-script-of-your-own)).

## `maplace/react`

The React binding, a client boundary (`"use client"`).

| Export | Kind | Explained in |
|---|---|---|
| `MaplaceProvider`, `MaplaceProviderProps`, `MaplaceControlledProps` | component, types | [`<MaplaceProvider>`](react.md#maplaceprovider) |
| `MaplaceEventProps` | type | [Event props](react.md#event-props) |
| `MaplaceMap`, `MaplaceMapProps`, `PopupContentRender`, `MarkerIconRender` | component, types | [`<MaplaceMap>`](react.md#maplacemap) |
| `LocationList`, `LocationListProps` | component, type | [`<LocationList>`](react.md#locationlist) |
| `MapControl`, `MapControlProps` | component, type | [`<MapControl>`](react.md#mapcontrol) |
| `useMaplace` | hook | [`useMaplace()`](react.md#usemaplace) |

## Errors

Misuse throws a `MaplaceError` from the call that caused it, with a `code` and, where they apply, the `locationId` and the `field`. In the element, where no caller can catch a throw, misuse is the element's error state and a `maplace-error` event instead ([misuse](element.md#misuse)); in React it throws from render or a layout effect, to the nearest error boundary. Runtime failures are never thrown: they are `error` events, with the same `MaplaceError`.

## Misuse codes

| Code | When |
|---|---|
| `invalid-input` | Bad data or arguments: a wrong or unknown field, a value out of range, a shape with too few points, a hidden location selected or hovered; the full list is in [RFC §3 Errors](../rfc-1.0.md#errors) |
| `duplicate-id` | Two locations with one id |
| `unknown-id` | An id not in the store: `select`, `hover`, `selectedId`, a route stop |
| `unsupported-capability` | A feature the adapter lacks |
| `missing-sanitizer` | `html` without `sanitize` |
| `already-attached` | A store attached twice, or an adapter reused |
| `destroyed` | A call after `destroy` that changes state or adds a listener |

Before `attach` the store skips capability checks; `attach` checks the current state against the adapter, and afterwards each call checks before changing anything.

## Runtime failures

| Code | When |
|---|---|
| `provider-load-failed` | The provider, or a part it loads (maplibre-gl, a style, the clusterer), failed to load; on Google also your own map made without a map ID |
| `provider-auth-failed` | The provider refused the key: Google's, or a style's server (HTTP 401 or 403) |
| `route-failed` | A route couldn't be computed |

For the first two, `loadState` becomes `error` and `whenReady()` rejects; one that comes after `ready` moves `loadState` from `ready` to `error`. An `icon`, `content` or `sanitize` function of yours that fails while the map draws is an `invalid-input` error event naming the location and the field: the map stays ready.

## Capabilities

A capability is a feature an adapter may or may not support; using one the adapter lacks is `unsupported-capability`. Google has all four; MapLibre all but `route`, as it has no routing ([routes](maplibre.md#routes)).

| Capability | What it allows |
|---|---|
| `route` | `setRoute`, the element's `route` and React's `route` prop |
| `cluster` | The `cluster` option |
| `circle` | Circle locations |
| `edit` | `editable` locations |

## Rules

- camelCase throughout; verbs for methods, nouns for types, one word per concept, and no two ways to do the same thing.
- At most two positional arguments, then an options object; never a boolean flag: `select(id, { pan: false })`, not `select(id, false)`.
- Absence is `undefined`, never `null`.
- Views know only the store, adapters know only their host, and only the element (or your code) wires them together.

The full rules are in [RFC §3](../rfc-1.0.md#rules-the-api-follows).
