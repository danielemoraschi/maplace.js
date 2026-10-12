import { describe, expect, it } from "vitest";
import { geometryOf } from "./geometry";

describe("geometryOf", () => {
  it("reads a location without type as a marker", () => {
    expect(geometryOf({ id: "a", lat: 1, lng: 2, title: "A" })).toEqual({
      type: "marker",
      lat: 1,
      lng: 2,
    });
  });

  it("takes a circle's centre and radius by reference", () => {
    const center = { lat: 1, lng: 2 };
    const geometry = geometryOf({ id: "c", type: "circle", center, radius: 5 });
    expect(geometry).toEqual({ type: "circle", center, radius: 5 });
    expect(geometry.type === "circle" && geometry.center).toBe(center);
  });

  it("takes a polyline's path by reference", () => {
    const path = [
      { lat: 0, lng: 0 },
      { lat: 1, lng: 1 },
    ];
    const geometry = geometryOf({ id: "l", type: "polyline", path });
    expect(geometry).toEqual({ type: "polyline", path });
    expect(geometry.type === "polyline" && geometry.path).toBe(path);
  });

  it("always gives a polygon a holes field, so geometries compare field by field", () => {
    const path = [
      { lat: 0, lng: 0 },
      { lat: 1, lng: 1 },
      { lat: 0, lng: 1 },
    ];
    expect(Object.keys(geometryOf({ id: "p", type: "polygon", path }))).toEqual([
      "type",
      "path",
      "holes",
    ]);
  });
});
