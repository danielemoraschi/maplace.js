import { describe, expect, it } from "vitest";
import { type GeoJSONFeatureCollection, locationsFromGeoJSON } from "./geojson";

const POINT = { type: "Point", coordinates: [1, 2] };

function withFeature(feature: unknown): unknown {
  return { type: "FeatureCollection", features: [feature] };
}

function withGeometry(geometry: unknown): unknown {
  return withFeature({ type: "Feature", id: "a", geometry, properties: null });
}

function withProperties(properties: unknown): unknown {
  return withFeature({ type: "Feature", id: "a", geometry: POINT, properties });
}

const POSITION = "a position, [lng, lat] in numbers";
const GEOMETRY_TYPES = 'one of "Point", "LineString", "Polygon"';

describe("locationsFromGeoJSON refuses what it can't read", () => {
  it.each([
    [
      "not an object",
      "places.geojson",
      'must be a GeoJSON FeatureCollection, got "places.geojson"',
      undefined,
    ],
    [
      "a lone Feature",
      { type: "Feature", id: "a", geometry: POINT },
      'type must be "FeatureCollection", got "Feature"',
      "type",
    ],
    [
      "features that aren't an array",
      { type: "FeatureCollection", features: {} },
      "features must be an array of features, got an object",
      "features",
    ],
    [
      "a feature that isn't an object",
      withFeature(null),
      "features[0] must be a GeoJSON Feature, got null",
      "features[0]",
    ],
    [
      "a feature without an id",
      withFeature({ type: "Feature", geometry: POINT }),
      "features[0].id must be a string or a number, got undefined",
      "features[0].id",
    ],
    [
      "an id of true",
      withFeature({ type: "Feature", id: true, geometry: POINT }),
      "features[0].id must be a string or a number, got true",
      "features[0].id",
    ],
    [
      "properties that aren't an object",
      withProperties("Rome"),
      'features[0].properties must be an object, got "Rome"',
      "features[0].properties",
    ],
    [
      "a title that isn't a string",
      withProperties({ title: 7 }),
      "features[0].properties.title must be a string, got 7",
      "features[0].properties.title",
    ],
    [
      "a group that isn't a string",
      withProperties({ group: 7 }),
      "features[0].properties.group must be a string, got 7",
      "features[0].properties.group",
    ],
    [
      "a null geometry",
      withGeometry(null),
      "features[0].geometry must be a Point, LineString or Polygon geometry, got null",
      "features[0].geometry",
    ],
    [
      "a MultiPolygon",
      withGeometry({ type: "MultiPolygon", coordinates: [] }),
      `features[0].geometry.type must be ${GEOMETRY_TYPES}, got "MultiPolygon"`,
      "features[0].geometry.type",
    ],
    [
      "a GeometryCollection",
      withGeometry({ type: "GeometryCollection", geometries: [] }),
      `features[0].geometry.type must be ${GEOMETRY_TYPES}, got "GeometryCollection"`,
      "features[0].geometry.type",
    ],
    [
      "a Point whose coordinates aren't a position",
      withGeometry({ type: "Point", coordinates: ["1", 2] }),
      `features[0].geometry.coordinates must be ${POSITION}, got an array`,
      "features[0].geometry.coordinates",
    ],
    [
      "a LineString whose coordinates aren't an array",
      withGeometry({ type: "LineString", coordinates: "1,2 3,4" }),
      'features[0].geometry.coordinates must be an array of positions, got "1,2 3,4"',
      "features[0].geometry.coordinates",
    ],
    [
      "a bad position inside a path",
      withGeometry({ type: "LineString", coordinates: [[1, 2], { lng: 3, lat: 4 }] }),
      `features[0].geometry.coordinates[1] must be ${POSITION}, got an object`,
      "features[0].geometry.coordinates[1]",
    ],
    [
      "a Polygon whose rings aren't an array",
      withGeometry({ type: "Polygon", coordinates: null }),
      "features[0].geometry.coordinates must be an array of rings, got null",
      "features[0].geometry.coordinates",
    ],
    [
      "a ring that isn't an array",
      withGeometry({
        type: "Polygon",
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
          ],
          5,
        ],
      }),
      "features[0].geometry.coordinates[1] must be an array of positions, got 5",
      "features[0].geometry.coordinates[1]",
    ],
  ])("%s", (_what, input, problem, field) => {
    expect(() => locationsFromGeoJSON(input as GeoJSONFeatureCollection)).toThrow(
      expect.objectContaining({
        code: "invalid-input",
        message: `locationsFromGeoJSON: ${problem}`,
        field,
      }),
    );
  });

  it("names the feature's id once it is read", () => {
    const input = withGeometry({ type: "MultiPoint", coordinates: [] }) as GeoJSONFeatureCollection;
    expect(() => locationsFromGeoJSON(input)).toThrow(expect.objectContaining({ locationId: "a" }));
  });
});
