# MapLibre adapter

`createMapLibreAdapter(options)` from `maplace/maplibre` draws a store on MapLibre GL JS; `maplace/maplibre` is the only entry that knows `maplibre-gl`. The element's MapLibre provider (`maplace/element/maplibre`, and the MapLibre CDN script) makes the same adapter from the element's attributes. The map draws OpenFreeMap's `liberty` style unless you give another, so it needs no key and no map ID.

The store, its list, its events and its errors are the same as on Google; what differs is in [capabilities](api.md#capabilities): no routes. Provider options belong to the adapter, never to the store. On Google: [Google adapter](google.md).

## Options

| Option | Type | What |
|---|---|---|
| `mapStyle` | `string \| StyleSpecification` | The map's style: a style URL or a style object; OpenFreeMap's `liberty` when left out ([styles and tiles](#styles-and-tiles)). Named `mapStyle` because the store's `style` is the shapes' default style |
| `map` | `maplibregl.Map` | Your own map to draw on, instead of one maplacejs creates; on the CDN script, made with `Maplace.maplibre` ([loading maplibre-gl](#loading-maplibre-gl)) |
| `mapOptions` | `MapOptions` | Extra options for a map maplacejs creates; not `container`, `style`, `center`, `zoom` or `bounds`, which maplacejs sets. `minZoom` and `maxZoom` are on MapLibre's scale ([zoom](#zoom)) |

An option the adapter doesn't know is `invalid-input`, and so is a key of `mapOptions` maplacejs sets, saying where it goes (`style` is `mapStyle`).

## `createMapLibreMap`

`createMapLibreMap(container, options)` is a store on a MapLibre map in one call, as [`createGoogleMap`](google.md#creategooglemap) is on Google. It makes the store with the [store's options](store.md#options), makes the adapter with `mapStyle` and `mapOptions`, attaches it in `container` (an element, or a selector the page matches), and returns the store; `destroy()` takes the map and its list down. The menu example's MapLibre version is one (its page, `vanilla.html` beside it, sizes the map and holds the North-only checkbox):

<!-- example: packages/maplace/examples/menu/maplibre/vanilla.ts -->
```ts
import "maplibre-gl/dist/maplibre-gl.css";
import { createMapLibreMap } from "maplace/maplibre";

const maplace = createMapLibreMap("#menu-maplibre-vanilla-map", {
  locations: [
    { id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome", group: "Centre" },
    { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan", group: "North" },
    { id: "turin", lat: 45.0703, lng: 7.6869, title: "Turin", group: "North" },
  ],
  list: { as: "select", heading: "Choose a location:", fitAllLabel: "All cities" },
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

A style URL given as `style` is `invalid-input`, telling you it is `mapStyle`: the store's `style` is the shapes'. Misuse names the part, as on Google: `createMaplace: options…`, `createMapLibreAdapter: options…`, `attach: container…`, `createListView: options…`.

Your own map, a control of your own on the map and a map opened again take the parts: `createMaplace`, `createMapLibreAdapter` and `attach` ([creating a store](store.md#creating-a-store)).

## Your own map

A map maplacejs creates is a new element filling the container (so size the container), removed on `destroy`. It opens on the world at zoom 1 and, as Google's 2D map, neither rotates nor tilts unless `mapOptions` allows it (`dragRotate` for rotation).

With `map`, maplacejs draws on your map and never moves it in the page or removes it; the store's `view` still sets its camera.

- `attach`'s container must be `map.getContainer()` or hold it.
- `mapStyle` and `mapOptions` are refused: your map's own style and options apply.
- `destroy` removes only what maplacejs added: its sources, layers, markers and controls.

`whenReady` waits for maplibre-gl to load and the map's style with it (and for supercluster on a map that clusters).

## Provider attributes

The element's MapLibre provider reads these attributes of `<maplace-map>` when the map opens.

| Attribute | What |
|---|---|
| `map-style` | A style URL, or a JSON style object, as `mapStyle`; OpenFreeMap's `liberty` when left out |
| `map-options` | A JSON object of MapLibre's map options, as `mapOptions`, with the same exclusions |

A change of either opens the map again where it was, keeping the store's state. A bad value is `invalid-input` naming the attribute (`map-options.center`; `map-options.style` is told to use `map-style`). `color-scheme` isn't read: the style sets the colours.

## With the CDN script

One script, `maplace-element-maplibre.iife.js`, defines the element with the MapLibre provider. It bundles maplibre-gl, its worker and its stylesheet, so a page loads it alone (about 501 kB gzip; clustering included):

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

The style says where the tiles, fonts and icons come from. OpenFreeMap's `https://tiles.openfreemap.org/styles/liberty` is the default: free, no key, OpenStreetMap data. Any provider's style URL works the same way, such as MapTiler, Stadia Maps, Protomaps or your own server, with its key in the URL where it needs one.

A style that fails to load is `provider-load-failed`, or `provider-auth-failed` when its server refuses it (HTTP 401 or 403: a key missing or wrong in its URL). A tile or sprite failing later is MapLibre's to log.

A dark map is a dark style (`map-style`), since MapLibre has no colour scheme option.

## Zoom

maplacejs speaks one zoom on every provider: Google's. MapLibre's tiles are 512 pixels, so its zoom is one lower, and the adapter adds one. The same `view`, `select(id, { zoom })`, location `zoom` and viewport zoom show the same area on either map. Only `mapOptions.minZoom` and `maxZoom`, which go to MapLibre as they are, are on MapLibre's scale.

## Markers and shapes

A marker with no icon is a pin like Google's, drawn in a layer of the map rather than the DOM, so thousands stay fast. The selected or hovered pin is drawn again in front, and is reached by keyboard through the list.

A marker with an `icon` is a DOM marker, focusable and pressed by Enter or Space. An `editable` marker is a DOM marker showing the pin, dragged there.

Circles are polygons of 128 points on the sphere, their radius in metres as on Google. Polylines and polygons across ±180 are drawn the short way.

An `editable` shape gets Google's handles: one on each point and one between each two, and a circle's centre and four radius handles. They work with the pointer only. A shape's `locationEdit` comes as the drag goes, and its `locationChange` on release.

## Popups

A popup is MapLibre's, headed by the location's title. One opened by a click pans the map to show it, and takes focus when the map held it, as Google's does. A hover's popup does neither.

## Clustering

The `cluster` option (the element's `cluster` attribute) groups markers with `supercluster`, on Google's clusterer's settings (60 px, up to zoom 16, at the rounded zoom), so the same clusters show at the same view on either map. They are maplacejs's own cluster markers: a count, titled "Cluster of N locations".

A click or Enter on a cluster eases to the zoom at which it splits. Circles, lines and polygons are never clustered, and the selected location is drawn on its own.

supercluster loads with the map, so `whenReady` waits for it, and a failed load is `provider-load-failed`. The MapLibre CDN script includes it: there is no separate cluster script.

## Routes

MapLibre has no routing, so `route` isn't among this adapter's capabilities. `setRoute`, the element's `route` and React's `route` prop are `unsupported-capability`, checked as every capability is ([capabilities](api.md#capabilities)). For a route, draw on [Google](google.md#routes).

## On-map controls

What goes on the map (`createMapLibreMap`'s `list`, the element's `list-position`, `<LocationList position>`, `<MapControl>`) sits in a panel like MapLibre's own controls, `.maplace-control`, in MapLibre's corners with their margins. It is light, as MapLibre's controls are, and `.maplace-control { color-scheme: dark }` gives a dark one.

maplacejs's lists scroll within the height of a map it creates. A bottom-right list stays clear of MapLibre's attribution. Classes and how to turn the defaults off: [Styling](styling.md).

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

const rome: Location[] = [{ id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" }];

function Simple() {
  return (
    <MaplaceProvider locations={rome}>
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
