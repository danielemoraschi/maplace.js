// Compile-time checks of the GeoJSON helper: each @ts-expect-error must stay an error.
import type { Feature, FeatureCollection, Point } from "geojson";
import { type GeoJSONFeatureCollection, type Location, locationsFromGeoJSON } from "maplace";
import { expectTypeOf } from "vitest";

declare const anyCollection: FeatureCollection;
expectTypeOf(locationsFromGeoJSON(anyCollection)).toEqualTypeOf<Location<unknown>[]>();

interface Shop {
  name: string;
  price: number;
}
declare const shops: FeatureCollection<Point, Shop>;
expectTypeOf(locationsFromGeoJSON<Shop>(shops)).toEqualTypeOf<Location<Shop>[]>();

const point = { type: "Point", coordinates: [12.5, 41.9] };
const mixed = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", id: 1, geometry: point, properties: { title: "Rome" } },
    { type: "Feature", id: 2, geometry: point, properties: { title: "Milan", group: "north" } },
    { type: "Feature", id: 3, geometry: point, properties: null },
  ],
};
expectTypeOf(locationsFromGeoJSON(mixed)).toEqualTypeOf<Location<unknown>[]>();
expectTypeOf(
  locationsFromGeoJSON({
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        id: "a",
        geometry: { type: "Point", coordinates: [1, 2] },
        properties: {},
      },
      { type: "Feature", id: "b", geometry: null, properties: null },
    ],
  }),
).toEqualTypeOf<Location<unknown>[]>();

const parsed: ReturnType<typeof JSON.parse> = JSON.parse("{}");
expectTypeOf(locationsFromGeoJSON(parsed)).toEqualTypeOf<Location<unknown>[]>();

const declared: GeoJSONFeatureCollection = { type: "FeatureCollection", features: [] };
locationsFromGeoJSON(declared);

declare const feature: Feature;
// @ts-expect-error a single Feature is not a collection
locationsFromGeoJSON(feature);
locationsFromGeoJSON({
  type: "FeatureCollection",
  // @ts-expect-error a feature's id is a string or a number
  features: [{ type: "Feature", id: true, geometry: null, properties: null }],
});
