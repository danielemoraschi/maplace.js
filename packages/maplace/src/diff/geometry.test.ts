import { describe, expect, it } from "vitest";
import type { Location } from "../location";
import { geometryOf, withGeometry } from "./geometry";

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

describe("withGeometry", () => {
  it("replaces a marker's position, keeping its own fields and leaving type unset", () => {
    const pin: Location = { id: "a", lat: 1, lng: 2, title: "A" };
    expect(withGeometry(pin, { type: "marker", lat: 3, lng: 4 })).toEqual({
      id: "a",
      lat: 3,
      lng: 4,
      title: "A",
    });
  });

  it("gives back what geometryOf reads, with points copied and frozen", () => {
    const polygon: Location = {
      id: "p",
      type: "polygon",
      path: [{ lat: 0, lng: 0 }],
      holes: [[{ lat: 1, lng: 1 }]],
    };
    const path = [{ lat: 5, lng: 5 }];
    const moved = withGeometry(polygon, { type: "polygon", path, holes: undefined });
    expect(geometryOf(moved)).toEqual({ type: "polygon", path, holes: undefined });
    expect(moved.type === "polygon" && moved.path).not.toBe(path);
    expect(moved.type === "polygon" && Object.isFrozen(moved.path[0])).toBe(true);
    const line: Location = { id: "l", type: "polyline", path: [] };
    expect(geometryOf(withGeometry(line, { type: "polyline", path }))).toEqual({
      type: "polyline",
      path,
    });
  });
});
