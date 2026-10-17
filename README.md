# maplace

A list of locations becomes a map plus a synced list, in a few lines. Click a marker and the list highlights it; pick it in the list and the map pans to it and opens it.

maplace 1.0 is a rewrite: no jQuery, no global, a small headless store with a Google Maps adapter, a list view and a `<maplace-map>` element. Coming from 0.2? See [MIGRATION.md](MIGRATION.md).

## Quick start

One script, no build step:

<!-- example: packages/maplace/examples/quick-start/page.html -->
```html
<script src="https://cdn.jsdelivr.net/npm/maplace@1/dist/maplace-element.iife.js"></script>
<maplace-map api-key="YOUR_KEY" map-id="DEMO_MAP_ID" list>
  <maplace-location location-id="rome" lat="41.9028" lng="12.4964" title="Rome"></maplace-location>
  <maplace-location location-id="milan" lat="45.4642" lng="9.19" title="Milan"></maplace-location>
</maplace-map>
```

- `api-key` is your Google Maps JavaScript API key. The element loads Maps JS itself, once per page.
- `map-id` is required: maplace draws advanced markers, which need a map ID. `DEMO_MAP_ID` is Google's public ID for development.
- `list` puts a list beside the map; `list="select"` makes it a native `<select>`, and `list-position` places it on the map or outside it. The list and popups come with default styles in `:where()`: any rule of yours wins.

Locations can also come from an inline `<script type="application/json">` child or the element's `locations` property. The element never fetches: load your data and assign it.

## One script per page

The CDN has two scripts. Load exactly one of them:

| Script | For |
|---|---|
| `maplace-element.iife.js` | everything but clustering |
| `maplace-element-cluster.iife.js` | the same, with `cluster` (bundles Google's MarkerClusterer; its licences are in `THIRD-PARTY-LICENSES.txt` beside it) |

A map with `cluster` on the first script fails to load and says to use the second.

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

The README published with each version has these filled in for it. unpkg serves the same paths (`https://unpkg.com/maplace@x.y.z/dist/…`). To compute a hash yourself:

```sh
curl -s https://cdn.jsdelivr.net/npm/maplace@x.y.z/dist/maplace-element.iife.js | openssl dgst -sha384 -binary | openssl base64 -A
```

## With a bundler

```sh
npm install maplace
```

The store and the Google adapter, on a page that loads Maps JS with [Google's bootstrap loader](https://developers.google.com/maps/documentation/javascript/load-maps-js-api) (or `@googlemaps/js-api-loader`):

<!-- example: packages/maplace/examples/simple/vanilla.ts -->
```ts
import { createMaplace } from "maplace";
import { createGoogleAdapter } from "maplace/google";

const maplace = createMaplace({
  locations: [{ id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" }],
});
const container = document.querySelector<HTMLElement>("#map");
if (container) maplace.attach(createGoogleAdapter({ mapId: "DEMO_MAP_ID" }), container);
```

For the element from npm, `import "maplace/element/google"` defines `<maplace-map>` and `<maplace-location>` with the Google provider.

| Entry | What it gives |
|---|---|
| `maplace` | `createMaplace` (the headless store), `createListView`, the adapter contract and the types |
| `maplace/google` | `createGoogleAdapter`: the only entry that knows `google.maps` |
| `maplace/element` | `<maplace-map>` and `<maplace-location>`, with `defineProvider` for other providers |
| `maplace/element/google` | the element with the Google provider registered |
| `maplace/react` | `<MaplaceProvider>`, `<MaplaceMap>`, `<LocationList>` and `useMaplace()` |

`@googlemaps/markerclusterer` is a dependency, loaded only by a store that clusters. `@types/google.maps` is an optional peer, for TypeScript pages that use `maplace/google`; `react` and `react-dom` (19) are optional peers, for `maplace/react`.

## With React

<!-- example: packages/maplace/examples/simple/react.tsx -->
```tsx
import type { Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { MaplaceMap, MaplaceProvider } from "maplace/react";

const createAdapter = () => createGoogleAdapter({ mapId: "DEMO_MAP_ID" });
const rome: Location[] = [{ id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" }];

export function Simple() {
  return (
    <MaplaceProvider locations={rome}>
      <MaplaceMap createAdapter={createAdapter} className="map" />
    </MaplaceProvider>
  );
}
```

`<MaplaceProvider>` makes one store for its children. Its `locations` follow your state; `selectedId` with `onSelectionChange` controls the selection, or `defaultSelectedId` only starts it. `<MaplaceMap>` attaches a fresh adapter while it is mounted, to a div its `className` sizes (a map fills its container). Its `popupContent` and `markerIcon` give popups and markers React content, as [the markers example](packages/maplace/examples/markers/react.tsx) does. `<LocationList>` is the store's list, with a function child for each entry's content, and `useMaplace()` returns the store to read with `useSyncExternalStore` or to call.

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
const createAdapter = () => createGoogleAdapter({ mapId: "DEMO_MAP_ID" });

export function CityMap() {
  return <MaplaceMap createAdapter={createAdapter} className="map" />;
}
```

`on<Event>` props, `popupContent`, `markerIcon` and a list's function child are functions too, so they go in client components as well; so does a controlled `selectedId`, which needs its `onSelectionChange`. A server component can start the selection with `defaultSelectedId`. Both files are the ones maplace's own test builds with Vite's RSC plugin.

## What it needs

- Evergreen browsers (ES2022). The package is ES modules only.
- Google Maps JavaScript API with a map ID. Routes need Maps JS 3.63 or later.

## Documentation

- [The 1.0 RFC](docs/rfc-1.0.md): the API, its rules, errors and numbers.
- [Examples](packages/maplace/examples/): ten scenarios, each as an HTML page, vanilla TypeScript and React.
- [MIGRATION.md](MIGRATION.md): from 0.2, option by option.
- [CHANGELOG.md](CHANGELOG.md).

The 0.2 README and code stay in the tag [`0.2.10`](https://github.com/danielemoraschi/maplace.js/tree/0.2.10).

## License

[MIT](LICENSE)
