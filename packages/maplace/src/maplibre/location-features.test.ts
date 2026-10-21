import { describe, expect, it } from "vitest";
import { markerDrawable, polygonDrawable, polylineDrawable } from "../testing/conformance/fixtures";
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

  it("carries the style fields set, and only those, for the layers' paint", () => {
    const style = { stroke: "#ff0000", strokeWidth: 2, fill: undefined };
    const { properties } = shapeFeature(polygonDrawable("p"), style, 3);
    expect(properties).toEqual({ id: "p", rank: 3, stroke: "#ff0000", strokeWidth: 2 });
  });
});
