# Locations

A location is one item of your data: a marker, a circle, a polyline or a polygon. Locations are a union on `type`; one without a `type` is a marker. Ids are yours (maplacejs never generates them) and must be unique; coordinates are `lat` and `lng`, in degrees. Optional fields accept an explicit `undefined`, so mapping your data across stays simple. Any other field throws `invalid-input`: your own fields go in `data`. The full rules are in [RFC §3 Shape](../rfc-1.0.md#shape).

<!-- example: packages/maplace/examples/polygon/vanilla.ts -->
```ts
import type { Location } from "maplace";
import { createGoogleMap } from "maplace/google";

/** Your own code, writing an edited location back to your server. */
declare function save(location: Location): Promise<void>;

const locations: Location[] = [
  {
    id: "park",
    type: "polygon",
    title: "Park",
    editable: true,
    path: [
      { lat: 41.91, lng: 12.48 },
      { lat: 41.92, lng: 12.49 },
      { lat: 41.9, lng: 12.5 },
    ],
  },
];
const maplace = createGoogleMap("#polygon-vanilla-map", { locations });
maplace.on("locationChange", ({ location }) => save(location));
```

On a page with the element, a `<maplace-location>` sets the same fields from its [attributes](element.md#location-attributes); the last column says which.

## Every location

| Field | Type | What | In HTML |
|---|---|---|---|
| `id` | `string` | Stable identity: updates, selection and routes refer to it. Required, unique | `location-id` |
| `type` | `"marker" \| "circle" \| "polyline" \| "polygon"` | Which shape it is; a marker when left out | `type` |
| `title` | `string` | Plain text: the list label, the accessible name on the map and its popup's heading | `title` |
| `content` | [`Content`](#content) | The popup's content | a `<template>` child |
| `html` | `string` | Untrusted HTML for the popup instead of `content`, rendered only through the store's `sanitize` | |
| `group` | `string` | Grouping key for list headings and `setFilter` | `group` |
| `zoom` | `number` | The zoom selecting it shows it at, centred where its popup points; a `select()`'s own `zoom` wins | `zoom` |
| `visible` | `boolean` | `false` keeps it in the data but not drawn, listed or selected. Default `true` | |
| `listed` | `boolean` | `false` leaves it out of every list view; the map still draws it and it is selected there. Default `true` | `listed` |
| `editable` | `boolean` | Lets the user drag a marker or reshape a shape; needs the `edit` capability | `editable` |
| `data` | your type | Your own fields, handed back to content, icon and render functions | |

## Markers

| Field | Type | What | In HTML |
|---|---|---|---|
| `lat`, `lng` | `number` | Where it is: `lat` from -90 to 90, `lng` from -180 to 180 | `lat`, `lng` |
| `icon` | [`Icon`](#icons) | A custom marker in place of the provider's own | `icon` (a URL), or a `<template data-icon>` child |

## Circles

| Field | Type | What | In HTML |
|---|---|---|---|
| `center` | `{ lat, lng }` | Its centre | `lat`, `lng` |
| `radius` | `number` | Its radius, in metres | `radius` |
| `style` | [`ShapeStyle`](#styles) | How it is drawn, over the store's `style` | `shape-style` (JSON) |
| `selectedStyle` | `ShapeStyle` | Drawn over `style` while selected | `selected-style` (JSON) |
| `hoveredStyle` | `ShapeStyle` | Drawn over `style` while hovered and not selected | `hovered-style` (JSON) |

## Polylines

| Field | Type | What | In HTML |
|---|---|---|---|
| `path` | `{ lat, lng }[]` | Its points, at least 2 | |
| `style` | `LineStyle` | How it is drawn: a stroke, no fill | `shape-style` (JSON) |
| `selectedStyle` | `LineStyle` | Drawn over `style` while selected | `selected-style` (JSON) |
| `hoveredStyle` | `LineStyle` | Drawn over `style` while hovered and not selected | `hovered-style` (JSON) |

A polyline or a polygon is one location with a `path`; in HTML, give it in the map's inline JSON script ([the element's data](element.md#data)).

## Polygons

| Field | Type | What | In HTML |
|---|---|---|---|
| `path` | `{ lat, lng }[]` | Its outer ring, at least 3 points | |
| `holes` | `{ lat, lng }[][]` | Inner rings, at least 3 points each | |
| `style` | [`ShapeStyle`](#styles) | How it is drawn, over the store's `style` | `shape-style` (JSON) |
| `selectedStyle` | `ShapeStyle` | Drawn over `style` while selected | `selected-style` (JSON) |
| `hoveredStyle` | `ShapeStyle` | Drawn over `style` while hovered and not selected | `hovered-style` (JSON) |

## Styles

A style says how a shape or a route line is drawn. Colours are CSS colours and widths are pixels. A `LineStyle` (polylines, routes) has the three stroke fields; a `ShapeStyle` (circles, polygons) adds the fill.

| Field | Type | What |
|---|---|---|
| `stroke` | `string` | The line's colour |
| `strokeOpacity` | `number` | The line's opacity, 0 to 1 |
| `strokeWidth` | `number` | The line's width |
| `fill` | `string` | The fill's colour; not on a polyline |
| `fillOpacity` | `number` | The fill's opacity, 0 to 1; not on a polyline |

A shape in a state is drawn as maplacejs's own look for that state, then its `style`, then its state style (`selectedStyle` or `hoveredStyle`), each the location's over the store's ([store options](store.md#options)). Selected wins over hovered. The state style comes last, so a store-wide `selectedStyle` shows on every shape whatever its own colours.

## Content

A popup's `content` is one of:

- a string, always rendered as text, never parsed as HTML;
- a DOM node;
- a function of the location returning a node.

For rich content, pass a node or a function. `html` takes a string of HTML instead, and only with the store's `sanitize` option, which must return safe HTML; giving both `content` and `html` is `invalid-input`. A location without either opens no popup: a click selects it.

## Icons

A marker's `icon` is one of:

- an image URL;
- a DOM node;
- a function of the location and its state (`{ selected, hovered }`) returning a node, run again only for markers whose state changed.

A DOM marker carries `data-selected` and `data-hovered` while in that state, so `[data-selected]` in CSS styles it. An `icon` or `content` function that throws, or returns something other than a node, is an `invalid-input` error event naming the location and the field: the map stays ready and draws the default marker, or opens no popup ([RFC §3 Errors](../rfc-1.0.md#errors)).

## From GeoJSON

`locationsFromGeoJSON` turns a GeoJSON FeatureCollection into locations, ready for `setLocations`. It is in the core entry, so it needs no provider; on the CDN scripts it is `Maplace.locationsFromGeoJSON`.

<!-- example: packages/maplace/examples/migrate/from-geojson.ts -->
```ts
// Locations from a GeoJSON file: its Points, LineStrings and Polygons, each feature's id its own.
import { locationsFromGeoJSON, type Maplace } from "maplace";

declare const maplace: Maplace; // your store, e.g. from createGoogleMap or createMapLibreMap

const response = await fetch("/places.geojson");
maplace.setLocations(locationsFromGeoJSON(await response.json()));
```

Each feature becomes one location:

- a `Point` becomes a marker, a `LineString` a polyline, and a `Polygon` a polygon: its first ring is the `path` and the others its `holes`;
- positions are GeoJSON's `[lng, lat]`, turned into `{ lat, lng }`; an altitude is dropped, and so is a ring's closing point (a last point equal to the first);
- `id` is the feature's `id`, a number becoming its string;
- `title` and `group` are the properties' own: strings, or `null` or absent for none;
- `data` is the properties whole, `title` and `group` included; `null` or no properties means no `data`.

A feature without an `id`, or with another geometry (`MultiPoint`, `MultiLineString`, `MultiPolygon`, a `GeometryCollection`, none), is `invalid-input` naming it, such as `features[2].geometry.type`. The values are checked as any location's are, when the store takes them. Map the features across first when the file doesn't fit, on the JSON as loaded (with your own types, cast `properties` to them):

- ids kept in a property: `locationsFromGeoJSON({ ...collection, features: collection.features.map((feature) => ({ ...feature, id: feature.properties?.code })) })`;
- no ids at all, as files from many tools have: the same call with `map((feature, index) => ({ ...feature, id: String(index) }))`; such ids stay the same only while the file keeps its order;
- other geometries: `features: collection.features.filter((feature) => ["Point", "LineString", "Polygon"].includes(feature.geometry?.type ?? ""))` in the same call keeps the ones it reads, or split them yourself, with ids of your own;
- typed properties: `locationsFromGeoJSON<Shop>(json)` types each location's `data`, as `createMaplace<Shop>()` does.

On `<maplace-map>`, set the `locations` property to the result. With React, compute it once, at module scope or in `useMemo`: `<MaplaceProvider locations>` applies every new array it is given.

## Addresses to coordinates

maplacejs takes coordinates, never addresses, at run time: no provider quota, no key in your page, nothing sent about your readers. A page with addresses geocodes them once, before it ships, and keeps the result if its geocoder allows it.

### May you keep the results?

Read on 2026-10-27:

| Geocoder | Keep the results? | Source |
|---|---|---|
| Google Geocoding API | No: cached up to 30 days, and shown only on a Google map | [Service terms](https://cloud.google.com/maps-platform/terms/maps-service-terms), [policies](https://developers.google.com/maps/documentation/geocoding/policies) |
| Mapbox | Only through permanent geocoding (`permanent=true`), billed at a higher rate | [Temporary vs permanent](https://docs.mapbox.com/help/dive-deeper/understand-temporary-vs-permanent-geocoding/) |
| OpenCage | Yes, under the data's licences (OpenStreetMap's ODbL) | [Terms](https://opencagedata.com/terms) |
| LocationIQ | Paid plans, while you are a customer; the free plan caches up to 48 hours | [Pricing](https://locationiq.com/pricing) |
| MapTiler | Yes for most uses, by their search FAQ; the free plan is non-commercial | [Search FAQ](https://www.maptiler.com/search/), [pricing](https://www.maptiler.com/cloud/pricing/) |
| Public Nominatim | Not for bulk: one request a second at most, and no systematic geocoding | [Usage policy](https://operations.osmfoundation.org/policies/nominatim/) |
| Self-hosted Nominatim or Photon | Yes: the data is OpenStreetMap's, under the ODbL | [OpenStreetMap copyright](https://www.openstreetmap.org/copyright) |

Terms change: read your geocoder's before you run it.

Results from OpenStreetMap data (OpenCage, Nominatim, Photon, and any other geocoder built on it) need "© OpenStreetMap contributors" on the page that shows them ([OpenStreetMap copyright](https://www.openstreetmap.org/copyright)).

### The script

Save it as `geocode.mts` and run `GEOCODER_KEY=your-key node geocode.mts places.json` (Node 22.18 or later runs it as it is). It reads places such as `[{ "id": "rome", "title": "Rome office", "address": "Via del Corso 1, Rome" }]` and writes each back with `lat` and `lng`, its address in `data`; a run stopped partway keeps what it placed, and the next asks only for what is left.

<!-- example: scripts/recipes/geocode.ts -->
```ts
// Addresses to coordinates, once, before your page ships: each place in places.json without
// coordinates gets them from the geocoder, its address kept in `data`. The key comes from the
// environment, never as an argument: GEOCODER_KEY=your-key node geocode.mts places.json
import { readFile, rename, writeFile } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";

interface Place {
  readonly id: string;
  readonly address?: string;
  readonly lat?: number;
  readonly data?: object;
}

/** OpenCage; another geocoder is its URL and where its answer puts the point. */
const geocoder = {
  url: (address: string, key: string) =>
    `https://api.opencagedata.com/geocode/v1/json?limit=1&no_annotations=1&key=${encodeURIComponent(key)}&q=${encodeURIComponent(address)}`,
  pointIn: (answer: { results: { geometry: { lat: number; lng: number } }[] }) =>
    answer.results[0]?.geometry,
};

const key = process.env.GEOCODER_KEY;
if (!key) throw new Error("Set GEOCODER_KEY to your geocoder's key");
const file = process.argv[2] ?? "places.json";
const places: Place[] = JSON.parse(await readFile(file, "utf8"));
for (const [index, { address, ...place }] of places.entries()) {
  if (place.lat !== undefined || !address?.trim()) continue;
  const response = await fetch(geocoder.url(address, key));
  if (!response.ok) {
    throw new Error(
      `${response.status} for "${address}": check the address, GEOCODER_KEY and your quota`,
    );
  }
  const point = geocoder.pointIn(await response.json());
  if (point) {
    places[index] = { ...place, ...point, data: { ...place.data, address } };
    // Saved at once, so a run stopped partway keeps what it placed; written aside, then moved
    // over the original, so a failed write never truncates it.
    await writeFile(`${file}.tmp`, `${JSON.stringify(places, null, 2)}\n`);
    await rename(`${file}.tmp`, file);
  } else {
    console.warn(`No match: ${address}`);
  }
  await sleep(1000); // one request a second: OpenCage's free rate
}
```

A place still holding an `address` (printed as `No match`, or blank), or with neither an address nor coordinates, isn't a location yet: correct its address and run the script again, or drop it. Then load the file as your locations: the element's inline JSON, `setLocations`, or `<MaplaceProvider locations>`.

### Another geocoder

Swap `geocoder` for another one whose terms let you keep the results: its request, and where its answer puts the point.

| Geocoder | `url(address, key)` | `pointIn(answer)` |
|---|---|---|
| Self-hosted Nominatim | `` `https://your-nominatim/search?format=jsonv2&limit=1&q=${encodeURIComponent(address)}` `` | `answer[0] && { lat: Number(answer[0].lat), lng: Number(answer[0].lon) }` |
| Self-hosted Photon | `` `https://your-photon/api?limit=1&q=${encodeURIComponent(address)}` `` | `answer.features[0] && { lat: answer.features[0].geometry.coordinates[1], lng: answer.features[0].geometry.coordinates[0] }` |
| MapTiler (free plan non-commercial) | `` `https://api.maptiler.com/geocoding/${encodeURIComponent(address)}.json?limit=1&key=${encodeURIComponent(key)}` `` | `answer.features[0] && { lat: answer.features[0].center[1], lng: answer.features[0].center[0] }` |

Change `pointIn`'s parameter type to the new answer's shape, the wait to the new geocoder's rate, and drop the key check for a self-hosted geocoder that takes none.

## From 0.2

Every 0.2 location field and its 1.0 replacement is in [Migrating, location fields](../../MIGRATION.md#location-fields).
