# MapLibre adapter

`createMapLibreAdapter(options)` from `maplace/maplibre` draws a store on MapLibre GL JS; `maplace/maplibre` is the only entry that knows `maplibre-gl`. The element's MapLibre provider (`maplace/element/maplibre`, and the MapLibre CDN script) makes the same adapter from the element's attributes. The map draws OpenFreeMap's `bright` style unless you give another, so it needs no key and no map ID.

The store, its list, its events and its errors are the same as on Google; what differs is in [capabilities](api.md#capabilities): no routes. Provider options belong to the adapter, never to the store. On Google: [Google adapter](google.md).

## Options

| Option | Type | What |
|---|---|---|
| `mapStyle` | `string \| StyleSpecification` | The map's style: a style URL or a style object; OpenFreeMap's `bright` when left out ([styles and tiles](#styles-and-tiles)). Named `mapStyle` because the store's `style` is the shapes' default style |
| `map` | `maplibregl.Map` | Your own map to draw on, instead of one maplacejs creates; on the CDN script, made with `Maplace.maplibre` ([loading maplibre-gl](#loading-maplibre-gl)) |
| `mapOptions` | `MapOptions` | Extra options for a map maplacejs creates; not `container`, `style`, `center`, `zoom` or `bounds`, which maplacejs sets ([the first view](store.md#the-first-view)). `minZoom` and `maxZoom` are on MapLibre's scale ([zoom](#zoom)) |

An option the adapter doesn't know is `invalid-input`, and so is a key of `mapOptions` maplacejs sets, saying where it goes (`style` is `mapStyle`), or one of Google's names MapLibre has its own for, saying which (`scrollwheel` is `scrollZoom`).

## `createMapLibreMap`

`createMapLibreMap(container, options)` is a store on a MapLibre map in one call, as [`createGoogleMap`](google.md#creategooglemap) is on Google. It makes the store with the [store's options](store.md#options), makes the adapter with `mapStyle` and `mapOptions`, attaches it in `container` (an element, or a selector the page matches), and returns the store; `destroy()` takes the map and its list down. The menu example's MapLibre version is one (its page, `vanilla.html` beside it, sizes the map and holds the North-only checkbox):

<!-- example: packages/maplace/examples/menu/maplibre/vanilla.ts -->
```ts
import "maplibre-gl/dist/maplibre-gl.css";
import { createMapLibreMap } from "maplace/maplibre";

const maplace = createMapLibreMap("#menu-maplibre-vanilla-map", {
  locations: [
    { id: "london", lat: 51.5074, lng: -0.1278, title: "London", group: "South" },
    { id: "edinburgh", lat: 55.9533, lng: -3.1883, title: "Edinburgh", group: "North" },
    { id: "belfast", lat: 54.5973, lng: -5.9301, title: "Belfast", group: "North" },
  ],
  list: { as: "select", heading: "Choose a location:", fitAll: true, fitAllLabel: "All cities" },
});

const northOnly = document.querySelector<HTMLInputElement>("#menu-maplibre-vanilla-north-only");
northOnly?.addEventListener("change", () => {
  maplace.setFilter(northOnly.checked ? ["North"] : undefined);
});
```

Its own options, beside the store's:

| Option | Type | What |
|---|---|---|
| `mapStyle` | `string \| StyleSpecification` | As the adapter's |
| `mapOptions` | `MapOptions` | As the adapter's |
| `list` | `true \| MapLibreMapList` | maplacejs's list: `true` for the default one, or the [list view's options](store.md#list-view-options) with its place |
| `list.position` | `ControlPosition` | The corner the list goes in; default `top-right` |
| `list.container` | `HTMLElement \| string` | An element, or a selector, to put the list in instead, beside the map; not with `position` |
| `myLocation` | `true \| MapLibreMapMyLocation` | A ["My location" control](store.md#the-my-location-control) on the map: `true`, or its `label`, `unavailableLabel` and `position` |
| `myLocation.position` | `ControlPosition` | The corner it goes in; default `top-left` |

A style URL given as `style` is `invalid-input`, telling you it is `mapStyle`: the store's `style` is the shapes'. Misuse names the part, as on Google: `createMaplace: options…`, `createMapLibreAdapter: options…`, `attach: container…`, `createListView: options…`.

Your own map, a control of your own on the map and a map opened again take the parts: `createMaplace`, `createMapLibreAdapter` and `attach` ([creating a store](store.md#creating-a-store)).

## Your own map

Most pages don't need this. Normally you give maplacejs a container and it creates the map: a new element filling the container (so size the container), removed on `destroy`. It opens on the world at zoom 1 and, as Google's 2D map, neither rotates nor tilts unless `mapOptions` allows it (`dragRotate` for rotation). You never touch the `maplibregl.Map` behind it, so you can do only what maplacejs has options for.

A map of your own is a `maplibregl.Map` your code created and gave to the adapter as `map`, so maplacejs draws on it instead of creating one. You'd do this for one of two reasons:

- **Your page already has a map.** You want maplacejs's markers, popups and list on it, not a second map beside it.
- **You need something maplacejs has no option for.** You hold the map, so you can call maplibre-gl yourself: a layer or source of your own, a plugin, a map event maplacejs doesn't report. It replaces 0.2's `oMap`.

To change a map setting or the style, `mapOptions` and `mapStyle` are enough, with no map of your own. Here the page makes its map, and a right-click, which maplacejs doesn't report, sets where distances are measured from:

<!-- example: packages/maplace/examples/own-map/maplibre.ts -->
```ts
// A map of your own on MapLibre: the page makes it, and maplacejs draws on it.
import "maplibre-gl/dist/maplibre-gl.css";
import { createMaplace } from "maplace";
import { createMapLibreAdapter } from "maplace/maplibre";
import { Map as MapLibreMap } from "maplibre-gl";

const map = new MapLibreMap({
  container: "own-map",
  style: "https://tiles.openfreemap.org/styles/bright",
  center: [12.4964, 41.9028],
  zoom: 5,
});

const maplace = createMaplace({
  locations: [
    { id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" },
    { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan" },
  ],
});
maplace.attach(createMapLibreAdapter({ map }), map.getContainer());

// A map event maplacejs doesn't report: a right-click measures distances from there.
map.on("contextmenu", ({ lngLat: { lat, lng } }) => maplace.setOrigin({ lat, lng }));
```

On the CDN script, make it with `new Maplace.maplibre.Map(…)`, the copy maplacejs draws with ([loading maplibre-gl](#loading-maplibre-gl)).

- `attach`'s container must be `map.getContainer()` or hold it.
- Unlike a map maplacejs creates, your map shows no panel when it fails: hear the `error` event.
- `mapStyle` and `mapOptions` are refused: your map's own style and options apply.
- The store's first view moves your map: by default it fits the locations. To keep your map where it is, give the store `view: { kind: "center", center: map.getCenter(), zoom: map.getZoom() + 1 }`: the store speaks [Google's zoom](#zoom), one higher.
- maplacejs never moves your map in the page, and `destroy` removes only what maplacejs added: its sources, layers, markers and controls.

`whenReady` waits for maplibre-gl to load and the map's style with it (and for supercluster on a map that clusters).

## Provider attributes

The element's MapLibre provider reads these attributes of `<maplace-map>` when the map opens.

| Attribute | What |
|---|---|
| `map-style` | A style URL, or a JSON style object, as `mapStyle`; OpenFreeMap's `bright` when left out |
| `map-options` | A JSON object of MapLibre's map options, as `mapOptions`, with the same exclusions |

A change of either opens the map again where it was, keeping the store's state. A bad value is `invalid-input` naming the attribute (`map-options.bounds`; `map-options.style` is told to use `map-style`, `map-options.center`, `map-options.zoom` and 0.2's `map-options.set_center` the [`center` and `zoom` attributes](element.md#map-attributes)). `color-scheme` isn't read: the style sets the colours.

## With the CDN script

One script, `maplace-element-maplibre.iife.js`, defines the element with the MapLibre provider. It bundles maplibre-gl, its worker and its stylesheet, so a page loads it alone (about 510 kB gzip; clustering included). [Open the page from a web server](setup.md#use-a-web-server-for-maplibre).

<!-- example: packages/maplace/examples/quick-start/maplibre/page.html -->
```html
<script src="https://cdn.jsdelivr.net/npm/maplace@1/dist/maplace-element-maplibre.iife.js"></script>
<maplace-map list>
  <maplace-location location-id="rome" lat="41.9028" lng="12.4964" title="Rome"></maplace-location>
  <maplace-location location-id="milan" lat="45.4642" lng="9.19" title="Milan"></maplace-location>
</maplace-map>
```

Nothing is fetched from other origins at runtime but the map's style and what it names (tiles, fonts, icons). The worker starts from a `blob:` URL, so a page with a content security policy allows `worker-src blob:`, and `img-src data: blob:` ([Content Security Policy](setup.md#content-security-policy)). Production pages pin the version with an integrity hash ([pin it for production](../../README.md#pin-it-for-production)).

## Loading maplibre-gl

From npm, `maplibre-gl` (6.15 or a later 6.x) is the page's to install: an optional peer, loaded when a MapLibre map mounts, so a page that never mounts one never loads it. The MapLibre CDN script bundles it, and gives it to a page's own script as `Maplace.maplibre`, the copy its maps are drawn with, to use as an npm page uses `import * as maplibregl from "maplibre-gl"` (`const maplibregl = Maplace.maplibre;`), a map of your own for `createMapLibreAdapter({ map })` included: so the script runs maplibre-gl as it loads, not when a map mounts. Missing, or with the browser giving no WebGL, loading fails with `provider-load-failed`.

From npm, the page brings maplibre-gl's stylesheet, `maplibre-gl/dist/maplibre-gl.css`, as every MapLibre page does (the CDN script adopts it itself): an import in a bundled module, as the examples do, or a `<link>`. Without it, markers and popups are misplaced, and maplacejs warns once in the console.

`import "maplace/element/maplibre"` defines the element with the MapLibre provider from npm, on the page's maplibre-gl and stylesheet.

## Styles and tiles

The style says where the tiles, fonts and icons come from. OpenFreeMap's `https://tiles.openfreemap.org/styles/bright` is the default: free, no key, OpenStreetMap data. Any provider's style URL works the same way, such as MapTiler, Stadia Maps, Protomaps or your own server, with its key in the URL where it needs one.

A style that fails to load is `provider-load-failed`, or `provider-auth-failed` when its server refuses it (HTTP 401 or 403: a key missing or wrong in its URL). A tile or sprite failing later is MapLibre's to log. A worker maplacejs hears fail is `provider-load-failed` naming the worker, on the maps open on it and every map mounted after, as they share it for the page's life; one that failed before maplacejs's first mount on the page goes unheard, so MapLibre's console line and your own map's `error` listener are what say so.

A dark map is a dark style (`map-style`), since MapLibre has no colour scheme option.

## Hidden maps

A browser keeps about 16 WebGL contexts per page, one per MapLibre map, and takes the oldest away past that, leaving that map blank. So a map maplacejs creates gives its context back while it's hidden (`display: none`, `hidden`, a closed tab) and the page's maps hold more than 8, the map hidden longest first, and takes it back once shown, drawing again from its style. Below 8, a hidden map keeps its context, so it shows again at once, without drawing from scratch. A map hidden with `visibility` or `opacity` keeps its context, and so does your own map (`map`). More than about 16 maps on show at once is past the browser's limit. Checked in Chromium.

## Zoom

maplacejs speaks one zoom on every provider: Google's. MapLibre's tiles are 512 pixels, so its zoom is one lower, and the adapter adds one. The same `view`, `select(id, { zoom })`, location `zoom` and viewport zoom show the same area on either map. Only `mapOptions.minZoom` and `maxZoom`, which go to MapLibre as they are, are on MapLibre's scale.

## Markers and shapes

A marker with no icon is a pin like Google's, drawn in a layer of the map rather than the DOM, so thousands stay fast. The selected or hovered pin is drawn again in front, and is reached by keyboard through the list.

A marker with an `icon` is a DOM marker, focusable and pressed by Enter or Space. An `editable` marker is a DOM marker showing the pin, dragged there.

Circles are polygons of 128 points on the sphere, their radius in metres as on Google. Polylines and polygons across ±180 are drawn the short way.

An `editable` shape gets Google's handles: one on each point and one between each two, and a circle's centre and four radius handles. They work with the pointer only. A shape's `locationEdit` comes as the drag goes, and its `locationChange` on release.

### The origin's dot

The dot at the store's [origin](store.md#distances) is a DOM marker of its own, with no feature, so nothing finds it as a location, and takes no input. It stacks above the canvas's pin layer and below DOM markers and the selected or hovered pin.

## Popups

A popup is MapLibre's, headed by the location's title. One opened by a click pans the map to show it, clear of what the map's corners hold when there is room, and takes focus when the map held it, as Google's does. A hover's popup does neither.

## Clustering

The `cluster` option (the element's `cluster` attribute) groups markers with `supercluster`, on Google's clusterer's settings (60 px, up to zoom 16, at the rounded zoom), so the same clusters show at the same view on either map. They are maplacejs's own cluster markers: a count, titled "Cluster of N locations", styled by `.maplace-cluster` ([cluster badges](styling.md#cluster-badges)).

A click or Enter on a cluster eases to the zoom at which it splits. Circles, lines and polygons are never clustered, and the selected location is drawn on its own.

supercluster loads with the map, so `whenReady` waits for it, and a failed load is `provider-load-failed`. The MapLibre CDN script includes it: there is no separate cluster script.

## Routes

MapLibre has no routing, so `route` isn't among this adapter's capabilities. `setRoute`, the element's `route` and React's `route` prop are `unsupported-capability`, checked as every capability is ([capabilities](api.md#capabilities)). For a route, draw on [Google](google.md#routes).

## On-map controls

What goes on the map (`createMapLibreMap`'s `list`, the element's `list-position`, `<LocationList position>`, `<MapControl>`) sits in a panel like MapLibre's own controls, `.maplace-control`, in MapLibre's corners with their margins. It is light, as MapLibre's controls are, and `.maplace-control { color-scheme: dark }` gives a dark one.

maplacejs's lists scroll within the map, one it creates or the page's own, clear of what the corners below them hold, MapLibre's attribution included; on a narrow map a bottom-left corner holding a maplacejs panel sits above the attribution. Classes and how to turn the defaults off: [Styling](styling.md).

## React

`<MaplaceMap createAdapter={createMapLibreAdapter} className="map" />` draws on MapLibre. With options, pass a function: `createAdapter={() => createMapLibreAdapter({ mapStyle })}`. The page installs maplibre-gl and imports its stylesheet. Popups' and icons' React content, `<LocationList position>` and `<MapControl>` work as on Google ([React](react.md)). The simple example's MapLibre version is one (its page, `react.html` beside it, gives the map its height):

<!-- example: packages/maplace/examples/simple/maplibre/react.tsx -->
```tsx
import "maplibre-gl/dist/maplibre-gl.css";
import type { Location } from "maplace";
import { createMapLibreAdapter } from "maplace/maplibre";
import { MaplaceMap, MaplaceProvider } from "maplace/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const london: Location[] = [{ id: "london", lat: 51.5074, lng: -0.1278, title: "London" }];

function Simple() {
  return (
    <MaplaceProvider locations={london}>
      <MaplaceMap createAdapter={createMapLibreAdapter} className="map" />
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("simple-maplibre-react-root") as HTMLElement).render(
  <StrictMode>
    <Simple />
  </StrictMode>,
);
```
