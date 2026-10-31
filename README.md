# maplacejs

A list of locations becomes a map plus a synced list, in a few lines. Click a marker and the list highlights it; pick it in the list and the map pans to it and opens it.

maplacejs is a rewrite: no jQuery, one store per map, with adapters for Google Maps and MapLibre, a list view and a `<maplace-map>` element. Coming from 0.2? See [MIGRATION.md](MIGRATION.md).

## Quick start

One script, no build step. On Google Maps:

<!-- example: packages/maplace/examples/quick-start/page.html -->
```html
<script src="https://cdn.jsdelivr.net/npm/maplace@1/dist/maplace-element.iife.js"></script>
<maplace-map api-key="YOUR_KEY" list>
  <maplace-location location-id="rome" lat="41.9028" lng="12.4964" title="Rome"></maplace-location>
  <maplace-location location-id="milan" lat="45.4642" lng="9.19" title="Milan"></maplace-location>
</maplace-map>
```

- `api-key` is your Google Maps JavaScript API key. The element loads Maps JS itself, once per page.
- `map-id` is optional: without it the map uses Google's `DEMO_MAP_ID`, for development, and warns once in the console; set your own for production ([key and map ID](docs/reference/setup.md#key-and-map-id)).
- `color-scheme` (`light`, `dark` or `follow-system`) and `map-options` (Google's map options as JSON, e.g. `'{"mapTypeControl":false}'`: not centre, zoom, map ID, colour scheme or `styles`: [centre and zoom](docs/reference/element.md#properties-and-methods)) set the map Google creates; change either and the map opens again where it was.

On MapLibre, with no key and no map ID:

<!-- example: packages/maplace/examples/quick-start/maplibre/page.html -->
```html
<script src="https://cdn.jsdelivr.net/npm/maplace@1/dist/maplace-element-maplibre.iife.js"></script>
<maplace-map list>
  <maplace-location location-id="rome" lat="41.9028" lng="12.4964" title="Rome"></maplace-location>
  <maplace-location location-id="milan" lat="45.4642" lng="9.19" title="Milan"></maplace-location>
</maplace-map>
```

- The MapLibre script bundles MapLibre GL JS, its worker and its stylesheet, so the page loads it alone. The map draws OpenFreeMap's `bright` style (OpenStreetMap data, free, no key). `map-style` takes another style URL or a JSON style, and `map-options` takes MapLibre's map options as JSON (not its container, style, centre, zoom or bounds: [centre and zoom](docs/reference/element.md#properties-and-methods)). Change either and the map opens again where it was ([MapLibre adapter](docs/reference/maplibre.md#provider-attributes)). A page with a content security policy allows the script's worker and images: `worker-src blob:` and `img-src data: blob:` ([Content Security Policy](docs/reference/setup.md#content-security-policy)).

On either:

- `list` puts a list beside the map; `list="select"` makes it a native `<select>`, `list="<name>"` your own view, given to `defineListView(name, (maplace, { options, listed }) => listView)`, which lists what `listed()` gives, as maplacejs's lists do (`listedLocations(snapshot)` from `maplace` gives the same to a list of your own outside the element, both before a scoped list narrows it to the map's view; a map held with `hold` builds its list on `release()`, once your view is defined); `list-position` places it on the map or outside it, `list-heading` shows a heading above it (on the map too), naming it for screen readers, and `list-scope="viewport"` shows a switch above it, "All" or "This area", which lists only what is in the map's view and follows the map. The list and popups come with default styles in `:where()`: any rule of yours wins, and `data-maplace-unstyled` turns them off ([Styling](docs/reference/styling.md) lists the classes to style instead). What goes on the map sits in a panel like the provider's own controls (`.maplace-control`): in the map's colour scheme on Google, light on MapLibre.

A location's popup is a `<template>` child, and a marker's own look an `icon` image URL or a `<template data-icon>` child (one element, marked `data-selected` and `data-hovered` while in that state, for your CSS). A location's `zoom` is where selecting it shows it, from a click on its marker or in the list too, and `listed="false"` keeps it on the map and out of the list; `editable` lets the user drag or reshape it. Both are booleans as HTML writes them: present, or `"true"`, is true.

A circle's styles (colours, opacities, stroke width) are JSON objects in `shape-style`, `selected-style` and `hovered-style`: `<maplace-location type="circle" … selected-style='{"stroke":"#c2410c","fill":"#f97316"}'>`.

Locations can also come from an inline `<script type="application/json">` child or the element's `locations` property. The element never fetches: load your data and assign it.

## One script per page

The CDN has three scripts. Load exactly one of them. Two scripts on one page are two copies of maplacejs, and the second's provider is never seen. A page with maps on both Google and MapLibre uses npm: both element entries, each map naming its `provider`.

| Script | For |
|---|---|
| `maplace-element.iife.js` | on Google, everything but clustering |
| `maplace-element-cluster.iife.js` | on Google, with `cluster` (bundles Google's MarkerClusterer; its licences are in `THIRD-PARTY-LICENSES.txt` beside it) |
| `maplace-element-maplibre.iife.js` | the element on MapLibre, clustering included: maplibre-gl, its worker and its stylesheet bundled, so one pinned file is all the page loads (about 501 kB gzip; the bundled packages' licences in `THIRD-PARTY-LICENSES.txt` beside it) |

A map with `cluster` on the first script fails to load and says to use the second.

Each script also sets one global, `Maplace`: what the npm entries it stands for export (`maplace`, the provider's and `maplace/element`), so a page of your own script calls `Maplace.createGoogleMap(...)` where npm's would import it, and defines its own list view with `Maplace.defineListView(name, factory)`. The MapLibre script's `Maplace.maplibre` is the maplibre-gl it bundles.

## Pin it for production

`maplace@1` follows the latest 1.x, so it can't carry an integrity hash. In production, pin the exact version and let the browser check the file:

```html
<script src="https://cdn.jsdelivr.net/npm/maplace@x.y.z/dist/maplace-element.iife.js"
  integrity="sha384-…" crossorigin="anonymous"></script>
```

or, with clustering:

```html
<script src="https://cdn.jsdelivr.net/npm/maplace@x.y.z/dist/maplace-element-cluster.iife.js"
  integrity="sha384-…" crossorigin="anonymous"></script>
```

or, on MapLibre:

```html
<script src="https://cdn.jsdelivr.net/npm/maplace@x.y.z/dist/maplace-element-maplibre.iife.js"
  integrity="sha384-…" crossorigin="anonymous"></script>
```

The README published with each version has these filled in for it. unpkg serves the same paths (`https://unpkg.com/maplace@x.y.z/dist/…`). To compute a hash yourself:

```sh
curl -s https://cdn.jsdelivr.net/npm/maplace@x.y.z/dist/maplace-element.iife.js | openssl dgst -sha384 -binary | openssl base64 -A
```

## From your own script

A page that makes its map in its own script, as 0.2's did, needs no build step either: the CDN script's `Maplace` holds what the npm entries export. Given `apiKey`, maplacejs adds Maps JS itself, as the element does from `api-key`:

<!-- example: packages/maplace/examples/simple/script.html -->
```html
<!doctype html>
<!-- A page of your own script: the CDN script, what the map mounts on, and the map made with Maplace, which adds Maps JS with your key. -->
<script src="https://cdn.jsdelivr.net/npm/maplace@1/dist/maplace-element.iife.js"></script>
<style>
  #simple-script-map { height: 24rem; }
</style>
<div id="simple-script-map"></div>
<script type="module">
  Maplace.createGoogleMap("#simple-script-map", {
    apiKey: "YOUR_KEY",
    locations: [{ id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" }],
  });
</script>
```

On MapLibre, `Maplace.createMapLibreMap` on the MapLibre script, with no key; `Maplace.maplibre` is the maplibre-gl it bundles, for a map of your own ([setup](docs/reference/setup.md#with-a-script-of-your-own)).

## With a bundler

```sh
npm install maplace
```

A store on a Google map in one call, `createGoogleMap`, on a page that loads Maps JS with [Google's bootstrap loader](https://developers.google.com/maps/documentation/javascript/load-maps-js-api) (or `@googlemaps/js-api-loader`) and gives the map's container its size:

<!-- example: packages/maplace/examples/simple/vanilla.html -->
```html
<!doctype html>
<!-- The page vanilla.ts runs on: Maps JS from Google's bootstrap loader, what the module mounts on, the module. -->
<script>
  (g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({
    key: "YOUR_KEY",
    v: "weekly",
  });
</script>
<style>
  #simple-vanilla-map { height: 24rem; }
</style>
<div id="simple-vanilla-map"></div>
<script type="module" src="./vanilla.ts"></script>
```

<!-- example: packages/maplace/examples/simple/vanilla.ts -->
```ts
import { createGoogleMap } from "maplace/google";

createGoogleMap("#simple-vanilla-map", {
  locations: [{ id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" }],
});
```

`list: true` adds maplacejs's list on the map, top right; `list` also takes the list view's options with a corner (`position`) or an element of the page to go in (`container`). `createGoogleMap` is made of three parts a page can use itself, when it draws on its own Google map, puts a control of its own on the map, or opens the map again: the store (`createMaplace`), the adapter (`createGoogleAdapter`) and `attach(adapter, "#map")`, which takes an element or a selector.

On MapLibre, `createMapLibreMap` from `maplace/maplibre` makes the same store in one call, with `mapStyle` and `mapOptions` for the map ([MapLibre adapter](docs/reference/maplibre.md#createmaplibremap)). The page installs `maplibre-gl` too (`npm install maplace maplibre-gl`), imports its stylesheet, `maplibre-gl/dist/maplibre-gl.css`, in its module, and needs no loader script and no key. Its parts are `createMaplace`, `createMapLibreAdapter` and `attach`. The simple example's MapLibre version is the whole page:

<!-- example: packages/maplace/examples/simple/maplibre/vanilla.html -->
```html
<!doctype html>
<!-- The page vanilla.ts runs on: what the module mounts on, and the module, which brings maplibre-gl and its stylesheet. -->
<style>
  #simple-maplibre-vanilla-map { height: 24rem; }
</style>
<div id="simple-maplibre-vanilla-map"></div>
<script type="module" src="./vanilla.ts"></script>
```

<!-- example: packages/maplace/examples/simple/maplibre/vanilla.ts -->
```ts
import "maplibre-gl/dist/maplibre-gl.css";
import { createMapLibreMap } from "maplace/maplibre";

createMapLibreMap("#simple-maplibre-vanilla-map", {
  locations: [{ id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" }],
});
```

Circles, polylines and polygons take a `style`, a `selectedStyle` and a `hoveredStyle` (and the store the same three, as defaults); maplacejs's own selected and hovered look fills what they leave unset.

For the element from npm, `import "maplace/element/google"` defines `<maplace-map>` and `<maplace-location>` with the Google provider, and `import "maplace/element/maplibre"` with the MapLibre provider (on the page's maplibre-gl and its stylesheet).

| Entry | What it gives |
|---|---|
| `maplace` | `createMaplace` (the headless store), `createListView`, `listedLocations`, `locationsFromGeoJSON` (a GeoJSON FeatureCollection as locations), the adapter contract and the types |
| `maplace/google` | `createGoogleMap` (a store on a Google map in one call) and `createGoogleAdapter`: the only entry that knows `google.maps` |
| `maplace/maplibre` | `createMapLibreMap` (a store on a MapLibre map in one call) and `createMapLibreAdapter`: the only entry that knows `maplibre-gl` |
| `maplace/element` | `<maplace-map>` and `<maplace-location>`, with `defineProvider` for other providers and `defineListView` for your own lists |
| `maplace/element/google` | the element with the Google provider registered |
| `maplace/element/maplibre` | the element with the MapLibre provider registered |
| `maplace/react` | `<MaplaceProvider>`, `<MaplaceMap>`, `<LocationList>` and `useMaplace()` |

`@googlemaps/markerclusterer` and `supercluster` are dependencies, each loaded only by a store that clusters on its provider. `maplibre-gl` (6.15 or a later 6.x) is an optional peer, for `maplace/maplibre` and `maplace/element/maplibre`; `@types/google.maps` is an optional peer, for TypeScript pages that use `maplace/google`; `react` and `react-dom` (19) are optional peers, for `maplace/react`; `vue` (3.3 or later) and `svelte` (4 or 5) are optional peers, for the element's types in their templates.

## With React

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

The file renders its own root, into [the page beside it](packages/maplace/examples/simple/react.html), which loads Maps JS as the vanilla page does and sizes the map's div. `<MaplaceProvider>` makes one store for its children. Its `locations` follow your state; `selectedId` with `onSelectionChange` controls the selection, or `defaultSelectedId` only starts it. `<MaplaceMap>` attaches a fresh adapter while it is mounted, to a div its `className` sizes (a map fills its container). Its `popupContent` and `markerIcon` give popups and markers React content, as [the markers example](packages/maplace/examples/markers/react.tsx) does. `<LocationList>` is the store's list, with a function child for each entry's content (inside `<MaplaceMap>`, its `position="top-right"` puts it on the map, and `<MapControl position>` puts your own content there), and `useMaplace()` returns the store to read with `useSyncExternalStore` or to call.

On MapLibre, `createAdapter={createMapLibreAdapter}` from `maplace/maplibre` is the only change, the module importing maplibre-gl's stylesheet ([MapLibre adapter](docs/reference/maplibre.md#react)).

In a React Server Component, `maplace/react` is a client boundary (it starts with `"use client"`): the server component loads the data and renders the provider and the list with it, and a small client component of yours holds the map, since its adapter is made by a function:

<!-- example: scripts/checks/rsc-app/src/page.tsx -->
```tsx
import type { Location } from "maplace";
import { LocationList, MaplaceProvider } from "maplace/react";
import { CityMap } from "./city-map";

/** Where a server component's data would come from: a database, an API. */
async function loadCities(): Promise<Location[]> {
  return [
    { id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" },
    { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan" },
  ];
}

/** A server component: it loads the data and hands it to the binding, a client boundary. */
export async function Page() {
  const cities = await loadCities();
  return (
    <html lang="en">
      <body>
        <MaplaceProvider locations={cities}>
          <CityMap />
          <LocationList label="Cities" />
        </MaplaceProvider>
      </body>
    </html>
  );
}
```

<!-- example: scripts/checks/rsc-app/src/city-map.tsx -->
```tsx
"use client";
import { createGoogleAdapter } from "maplace/google";
import { MaplaceMap } from "maplace/react";

// Functions can't cross from a server component: the map's adapter is made here, on the client.
export function CityMap() {
  return <MaplaceMap createAdapter={createGoogleAdapter} className="map" />;
}
```

`on<Event>` props, `popupContent`, `markerIcon` and a list's function child are functions too, so they go in client components as well; so does a controlled `selectedId`, which needs its `onSelectionChange`. A server component can start the selection with `defaultSelectedId`. Both files are the ones maplacejs's own test builds with Vite's RSC plugin.

## What it needs

- Evergreen browsers (ES2022). The package is ES modules only.
- Google Maps JavaScript API (a map ID of your own for production; routes need Maps JS 3.63 or later), or MapLibre GL JS 6.15 or a later 6.x with a style, OpenFreeMap's by default, no key (the MapLibre CDN script bundles it). Routes are Google's only.

## Documentation

- [The 1.0 RFC](docs/rfc-1.0.md): the API, its rules, errors and numbers.
- [Examples](packages/maplace/examples/): seventeen scenarios, each as an HTML page, a page of your own script on `Maplace`, vanilla TypeScript and React on Google, and all but `route` on MapLibre too, in each one's `maplibre/` folder.
- [MIGRATION.md](MIGRATION.md): from 0.2, option by option.
- [CHANGELOG.md](CHANGELOG.md).

The 0.2 README and code stay in the tag [`0.2.10`](https://github.com/danielemoraschi/maplace.js/tree/0.2.10).

## License

[MIT](LICENSE)
