# Google adapter

`createGoogleAdapter(options)` from `maplace/google` draws a store on Google Maps; `maplace/google` is the only entry that knows `google.maps`. The element's Google provider (`maplace/element/google`, and the CDN script) makes the same adapter from the element's attributes. Provider options belong to the adapter, never to the store. On MapLibre: [MapLibre adapter](maplibre.md).

## Options

| Option | Type | What |
|---|---|---|
| `mapId` | `string` | Optional: Google's `DEMO_MAP_ID` by default, for development, with a console warning; your own for production ([key and map ID](setup.md#key-and-map-id)) |
| `colorScheme` | `"light" \| "dark" \| "follow-system"` | The colour scheme of a map maplacejs creates |
| `map` | `google.maps.Map` | Your own map to draw on, instead of one maplacejs creates |
| `mapOptions` | `google.maps.MapOptions` | Extra options for a map maplacejs creates; not `center`, `zoom`, `mapId`, `colorScheme` or `styles` |
| `apiKey` | `string` | Your Maps API key: maplacejs adds Maps JS to the page with it as the map mounts, unless the page loaded Maps JS already ([loading Maps JS](#loading-maps-js)) |
| `version` | `string` | Maps JS's version, as Google's `v`; with `apiKey` |
| `language` | `string` | The language of Google's labels and route instructions; with `apiKey` |
| `region` | `string` | The region Google biases its answers to; with `apiKey` |
| `nonce` | `string` | The nonce your content security policy asks the Maps JS tag for; with `apiKey` |

`center` and `zoom` are left out of `mapOptions` because only the store's `view` sets them, and JSON `styles` because Google ignores them on a map with a map ID ([map ID and styling](#map-id-and-styling)). An option the adapter doesn't know is `invalid-input`.

## `createGoogleMap`

`createGoogleMap(container, options)` is a store on a Google map in one call, as 0.2's `new Maplace(options).Load()` was. It makes the store with the [store's options](store.md#options), the adapter with `mapId`, `colorScheme`, `mapOptions` and Maps JS's settings, attaches it in `container` (an element, or a selector the page matches), and returns the store; `destroy()` takes the map and its list down.

<!-- example: packages/maplace/examples/menu/vanilla.ts -->
```ts
import { createGoogleMap } from "maplace/google";

const maplace = createGoogleMap("#menu-vanilla-map", {
  locations: [
    { id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome", group: "Centre" },
    { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan", group: "North" },
    { id: "turin", lat: 45.0703, lng: 7.6869, title: "Turin", group: "North" },
  ],
  list: { as: "select", heading: "Choose a location:", fitAllLabel: "All cities" },
});

const northOnly = document.querySelector<HTMLInputElement>("#menu-vanilla-north-only");
northOnly?.addEventListener("change", () => {
  maplace.setFilter(northOnly.checked ? ["North"] : undefined);
});
```

Its own options, beside the store's:

| Option | Type | What |
|---|---|---|
| `mapId` | `string` | Optional, as the adapter's |
| `colorScheme` | `"light" \| "dark" \| "follow-system"` | As the adapter's |
| `mapOptions` | `google.maps.MapOptions` | As the adapter's |
| `apiKey` | `string` | As the adapter's: maplacejs adds Maps JS with it |
| `version`, `language`, `region`, `nonce` | `string` | As the adapter's, with `apiKey` |
| `list` | `true \| GoogleMapList` | maplacejs's list: `true` for the default one, or the [list view's options](store.md#list-view-options) with its place |
| `list.position` | `ControlPosition` | The corner of the map the list goes in; default `top-right`, where 0.2 put its controls |
| `list.container` | `HTMLElement \| string` | An element, or a selector, to put the list in instead, beside the map (0.2's `controls_div`); not with `position` |

Each part checks what it is handed, so misuse names the part: `createMaplace: options…`, `createGoogleAdapter: options…`, `attach: container…` (a selector matching nothing), `createListView: options…`. A store that can't be attached is destroyed before the error goes on.

Your own map (`map`), a control of your own on the map (`adapter.mountControl`) and a map opened again with a new adapter need the adapter, so they take the parts: `createMaplace`, `createGoogleAdapter` and `attach` ([creating a store](store.md#creating-a-store)).

## Your own map

A map maplacejs creates is a new element filling the container (so size the container), removed on `destroy`. With `map`, maplacejs draws on your map and never moves it in the page or removes it; the store's `view` still sets its camera.

- `attach`'s container must be `map.getDiv()` or hold it.
- `mapOptions` and `colorScheme` are refused: set them on your map.
- Your map's own map ID applies: keep `mapId` the same. Google shows no markers on a map made without one, so that is `provider-load-failed` with `field: 'mapId'`.
- `destroy` removes only what maplacejs added.

`whenReady` waits for Google to initialise the map, created or yours (at most 2 s, and not while it is hidden).

## Provider attributes

The element's Google provider reads these attributes of `<maplace-map>` when the map opens.

| Attribute | What |
|---|---|
| `map-id` | Optional: the map ID, as `mapId` |
| `nonce` | The nonce of the Maps JS script it adds, for a Content Security Policy; read as the element's `nonce` property, so one Vue or Svelte sets, or one a header CSP hides from the attribute, still counts |
| `color-scheme` | `light`, `dark` or `follow-system`, as `colorScheme` |
| `map-options` | A JSON object of Google's map options, as `mapOptions`, with the same exclusions |
| `api-key` | The key Maps JS loads with; needed only when the provider adds Maps JS itself |
| `version` | The Maps JS version to load |
| `language` | The language Maps JS loads with |
| `region` | The region Maps JS loads with |

A change of `color-scheme` or `map-options` opens the map again where it was, keeping the store's state, since Google sets a colour scheme only on a new map; each re-open is a new map load, which Google bills. A bad value is `invalid-input` naming the attribute (`map-options.center`).

## Loading Maps JS

Nothing reads `google` on import. The adapter calls the global `google.maps.importLibrary`, which works with [Google's bootstrap loader](https://developers.google.com/maps/documentation/javascript/load-maps-js-api) and with `@googlemaps/js-api-loader`, so maplacejs has no loader dependency. Without `google.maps.importLibrary` (an old or missing Maps JS) loading fails with `provider-load-failed`.

The element's Google provider adds Maps JS itself, from `api-key`, and so does an adapter given `apiKey`, as its map mounts: one script per page however many maps, never while the element is held or before the adapter's map mounts. Maps JS's settings, `version`, `language`, `region` and `nonce`, go with the key; without `apiKey`, or with your own `map`, an adapter refuses them (`invalid-input`). The page's Maps JS tag, whoever added it, is shared: an element asking it for another `api-key`, `version`, `language` or `region` is misuse, and an adapter asking for another fails its load with `provider-load-failed`, the option in `field` (one it leaves out takes the page's). A page that loaded Maps JS without a tag of its own (the bootstrap loader, js-api-loader) is taken as it is, an adapter's settings unused. [Setup](setup.md) has both routes.

## Map ID and styling

maplacejs draws advanced markers only (Google deprecated the legacy `Marker`), so every map has a map ID: yours, or Google's `DEMO_MAP_ID`, for development, when you give none, which warns once in the console ([key and map ID](setup.md#key-and-map-id)). A map is styled through its map ID's Cloud styling, plus `colorScheme`; `DEMO_MAP_ID` carries none.

## Routes

Routes use Google's Routes library, which needs Maps JS 3.63 or later; an older one fails the route with `route-failed`. A route has 2 to 27 stops (the adapter's `routeStopLimit`), `via` stops counting too. Each leg comes with its turn-by-turn `steps`, at no extra cost, each `instruction` in the language Maps JS loaded with. Each computation is billed, so a route is computed only when it changes ([routes](store.md#routes)).

## Clustering

The `cluster` option (the element's `cluster` attribute) groups markers with `@googlemaps/markerclusterer`, drawing maplacejs's own cluster markers: a count, titled "Cluster of N locations". Circles, lines and polygons are never clustered, and the selected location is drawn on its own. Only the view and half a view around it are clustered and on the map, as on MapLibre, so a map zoomed in carries the markers it shows, not every one, and a short pan draws nothing again. The clusterer loads with the map, so `whenReady` waits for it; a failed load is `provider-load-failed`. On the CDN, a map with `cluster` needs `maplace-element-cluster.iife.js`, which bundles it; on the plain script it fails to load, naming the cluster script.

## When Google refuses

Google refusing the key (an invalid key, a referrer the key doesn't allow, the API or billing not enabled, a quota used up) is `provider-auth-failed` for every map on the page. Google checks the key as the first map opens, so this can come after `ready`: maplacejs then stops drawing and leaves the map, with Google's message on it, until `destroy`. Your own `gm_authFailure` still runs. A missing key isn't refused (Google draws the map and logs `ApiProjectMapError`), so it reports nothing.

## Clicks and edits

A click on the map is reported 250 ms after it, unless a double-click comes first, so a double-click zoom neither fires `mapClick` nor clears the selection; a location clicked within those 250 ms drops the map's click. A marker reports its drag as it moves (`locationEdit`); Google says where a shape's handle went only when it is let go, so a shape's `locationEdit` comes once, with its `locationChange`. A window losing focus ends a marker's drag where it was, with its `locationChange`; a shape's handle drag is cut short instead, nothing reported and the shape left where the store has it, as Google gives no handle place until it is let go.

## Popups

A popup is Google's InfoWindow, headed by the location's title. One opened by a click or from the list pans the map to show it, once Google's own pan ends, clear of what the map's corners hold when there is room (never over Google's logo or terms; with no room, Google's own pan stands). A hover's popup doesn't pan.

## Hidden maps

A Google map with a map ID draws with WebGL, and a browser keeps about 16 WebGL contexts per page, taking the oldest away past that. So a vector map maplacejs creates gives its context back while it's hidden (`display: none`, `hidden`, a closed tab), takes it back once shown, and gives it back when destroyed. A raster map holds none, and your own map (`map`) keeps its context. Checked in Chromium.
