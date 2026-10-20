# Locations

A location is one item of your data: a marker, a circle, a polyline or a polygon. Locations are a union on `type`; one without a `type` is a marker. Ids are yours (maplace never generates them) and must be unique; coordinates are `lat` and `lng`, in degrees. Optional fields accept an explicit `undefined`, so mapping your data across stays simple. Any other field throws `invalid-input`: your own fields go in `data`. The full rules are in [RFC §3 Shape](../rfc-1.0.md#shape).

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
| `title` | `string` | Plain text: the list label and the accessible name on the map | `title` |
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

A shape in a state is drawn as maplace's own look for that state, then its `style`, then its state style (`selectedStyle` or `hoveredStyle`), each the location's over the store's ([store options](store.md#options)). Selected wins over hovered. The state style comes last, so a store-wide `selectedStyle` shows on every shape whatever its own colours.

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

## From 0.2

Every 0.2 location field and its 1.0 replacement is in [Migrating, location fields](../../MIGRATION.md#location-fields).
