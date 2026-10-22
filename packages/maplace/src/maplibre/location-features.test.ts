import { describe, expect, it } from "vitest";
import type { Geometry, LatLng } from "../geometry";
import {
  circleDrawable,
  markerDrawable,
  polygonDrawable,
  polylineDrawable,
} from "../testing/conformance/fixtures";
import { CIRCLE_SEGMENTS } from "./circle-sphere";
import { pinFeature, shapeFeature } from "./location-features";

describe("pinFeature", () => {
  it("puts a marker at its point, longitude first, with its id and rank", () => {
    const feature = pinFeature(markerDrawable("a", { lat: 10, lng: 20 }), 7);
    expect(feature.geometry).toEqual({ type: "Point", coordinates: [20, 10] });
    expect(feature.properties).toEqual({ id: "a", rank: 7 });
  });
});

describe("shapeFeature", () => {
  it("closes a polygon's rings, its holes included, as GeoJSON wants", () => {
    const { geometry } = shapeFeature(polygonDrawable("p"), undefined, 1);
    expect(geometry).toEqual({
      type: "Polygon",
      coordinates: [
        [
          [-1, -1],
          [1, -1],
          [1, 1],
          [-1, 1],
          [-1, -1],
        ],
        [
          [-0.5, -0.5],
          [0.5, -0.5],
          [0.5, 0.5],
          [-0.5, 0.5],
          [-0.5, -0.5],
        ],
      ],
    });
  });

  it("gives a polyline its path as a line", () => {
    const { geometry } = shapeFeature(polylineDrawable("l"), undefined, 1);
    expect(geometry).toEqual({
      type: "LineString",
      coordinates: [
        [0, 0],
        [1, 1],
      ],
    });
  });

  it("draws a polyline from 179 to -179 the short way, as 179 to 181", () => {
    const path = [
      { lat: 0, lng: 179 },
      { lat: 1, lng: -179 },
    ];
    const { geometry } = shapeFeature(
      polylineDrawable("l", { geometry: lineOf(path) }),
      undefined,
      1,
    );
    expect(geometry).toEqual({
      type: "LineString",
      coordinates: [
        [179, 0],
        [181, 1],
      ],
    });
  });

  it("keeps a polygon's hole across ±180 in its outline's world copy", () => {
    const geometry: Geometry = {
      type: "polygon",
      path: squareAcross(2),
      // The hole's first corner west of ±180, the outline's east of it.
      holes: [[...squareAcross(1).slice(1), ...squareAcross(1).slice(0, 1)]],
    };
    const feature = shapeFeature(polygonDrawable("p", { geometry }), undefined, 1);
    const [, hole = []] = (feature.geometry as GeoJSON.Polygon).coordinates;
    expect(hole.every(([lng = 0]) => lng > 0)).toBe(true);
  });

  it("leaves every longitude as given when no shape crosses ±180", () => {
    const path = [
      { lat: 0.1, lng: 0.1 },
      { lat: 0.2, lng: 0.3 },
      { lat: -0.7, lng: -0.3 },
    ];
    const { geometry } = shapeFeature(
      polylineDrawable("l", { geometry: lineOf(path) }),
      undefined,
      1,
    );
    const longitudes = (geometry as GeoJSON.LineString).coordinates.map(([lng]) => lng);
    expect(longitudes).toEqual(path.map(({ lng }) => lng));
  });

  it("gives a circle a closed polygon ring around its centre", () => {
    const { geometry } = shapeFeature(circleDrawable("c"), undefined, 1);
    const [ring = []] = (geometry as GeoJSON.Polygon).coordinates;
    expect(geometry.type).toBe("Polygon");
    expect(ring).toHaveLength(CIRCLE_SEGMENTS + 1);
    expect(ring.at(-1)).toEqual(ring[0]);
  });

  it("carries a circle's style fields, as a polygon's", () => {
    const style = { fill: "#00ff00", fillOpacity: 0.5 };
    const { properties } = shapeFeature(circleDrawable("c"), style, 2);
    expect(properties).toEqual({ id: "c", rank: 2, ...style });
  });

  it("carries the style fields set, and only those, for the layers' paint", () => {
    const style = { stroke: "#ff0000", strokeWidth: 2, fill: undefined };
    const { properties } = shapeFeature(polygonDrawable("p"), style, 3);
    expect(properties).toEqual({ id: "p", rank: 3, stroke: "#ff0000", strokeWidth: 2 });
  });
});

function lineOf(path: readonly LatLng[]): Geometry {
  return { type: "polyline", path };
}

/** A square `half` degrees each way round the equator at ±180, its corners as stored. */
function squareAcross(half: number): LatLng[] {
  return [
    { lat: -half, lng: 180 - half },
    { lat: -half, lng: -180 + half },
    { lat: half, lng: -180 + half },
    { lat: half, lng: 180 - half },
  ];
}
