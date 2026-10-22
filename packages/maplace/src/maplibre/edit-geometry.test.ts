import { describe, expect, it } from "vitest";
import type { Geometry, LatLng } from "../geometry";
import {
  holeCornerMoved,
  MOVED_HOLE_CORNER,
  ORIGIN,
  polygonDrawable,
} from "../testing/conformance/fixtures";
import { pointAtBearing } from "./circle-sphere";
import { editedBy, handlePlacesOf } from "./edit-geometry";

const line: Geometry = {
  type: "polyline",
  path: [ORIGIN, { lat: 1, lng: 1 }, { lat: 1, lng: 3 }],
};
const circle: Geometry = { type: "circle", center: ORIGIN, radius: 1000 };
const polygon = polygonDrawable("p").geometry;

const kinds = (geometry: Geometry) => handlePlacesOf(geometry).map(({ role }) => role.kind);

describe("handlePlacesOf", () => {
  it("puts a handle on each polyline point and between each two", () => {
    const places = handlePlacesOf(line);
    expect(kinds(line)).toEqual(["vertex", "vertex", "vertex", "midpoint", "midpoint"]);
    expect(places[3]?.at.lat).toBeCloseTo(0.5, 4);
    expect(places[3]?.at.lng).toBe(0.5);
    expect(places[4]?.at.lat).toBeCloseTo(1, 9);
    expect(places[4]?.at.lng).toBe(2);
  });

  it("puts a midpoint on its edge as drawn, a straight line on the Mercator plane", () => {
    const north: Geometry = {
      type: "polyline",
      path: [
        { lat: 60, lng: 0 },
        { lat: 80, lng: 40 },
      ],
    };
    const [, , midpoint] = handlePlacesOf(north);
    expect(midpoint?.at.lng).toBe(20);
    // Halfway between the two ends' Mercator y, ln(tan(45° + lat / 2)): not the latitudes' 70.
    expect(midpoint?.at.lat).toBeCloseTo(72.59, 2);
  });

  it("puts a midpoint across ±180 on the short way between its ends", () => {
    const across: Geometry = {
      type: "polyline",
      path: [
        { lat: 0, lng: 179 },
        { lat: 0, lng: -179 },
      ],
    };
    const [, , midpoint] = handlePlacesOf(across);
    expect(Math.abs(midpoint?.at.lng ?? 0)).toBe(180);
  });

  it("puts a polygon's midpoints on every edge, its closing edge and its holes' included", () => {
    const places = handlePlacesOf(polygon);
    expect(places.filter(({ role }) => role.kind === "vertex")).toHaveLength(8);
    expect(places.filter(({ role }) => role.kind === "midpoint")).toHaveLength(8);
    const closing = places.find(
      ({ role }) => role.kind === "midpoint" && role.ring === 0 && role.index === 3,
    );
    expect(closing?.at).toEqual({ lat: 0, lng: -1 });
  });

  it("puts a circle's handles on its centre and radius metres north, east, south and west", () => {
    const places = handlePlacesOf(circle);
    expect(places.map(({ role }) => role)).toEqual([
      { kind: "center" },
      { kind: "radius", bearing: 0 },
      { kind: "radius", bearing: 90 },
      { kind: "radius", bearing: 180 },
      { kind: "radius", bearing: 270 },
    ]);
    expect(places[0]?.at).toEqual(ORIGIN);
    expect(places[2]?.at).toEqual(pointAtBearing(ORIGIN, 1000, 90));
  });

  it("gives a marker no handles: markers are dragged themselves", () => {
    expect(handlePlacesOf({ type: "marker", ...ORIGIN })).toEqual([]);
  });
});

describe("editedBy", () => {
  it("moves one corner of a hole, the rest kept", () => {
    const role = { kind: "vertex", ring: 1, index: 2 } as const;
    expect(editedBy(polygon, role, MOVED_HOLE_CORNER)).toEqual(holeCornerMoved());
  });

  it("inserts a point where a midpoint is dragged, after the segment's start", () => {
    const to: LatLng = { lat: 0.2, lng: 0.8 };
    const edited = editedBy(line, { kind: "midpoint", ring: 0, index: 0 }, to);
    expect(edited).toEqual({ type: "polyline", path: [ORIGIN, to, ...line.path.slice(1)] });
  });

  it("keeps a polygon without holes without them", () => {
    const square: Geometry = {
      type: "polygon",
      path: polygon.type === "polygon" ? polygon.path : [],
    };
    const edited = editedBy(square, { kind: "vertex", ring: 0, index: 0 }, ORIGIN);
    expect(edited).not.toHaveProperty("holes");
  });

  it("moves a circle by its centre, its radius kept", () => {
    const to = { lat: 2, lng: 3 };
    expect(editedBy(circle, { kind: "center" }, to)).toEqual({ ...circle, center: to });
  });

  it("reads a radius to the millimetre", () => {
    const to = pointAtBearing(ORIGIN, 2000, 90);
    expect(editedBy(circle, { kind: "radius", bearing: 90 }, to)).toEqual({
      ...circle,
      radius: 2000,
    });
  });

  it("refuses a vertex handle on a circle, naming both", () => {
    expect(() => editedBy(circle, { kind: "vertex", ring: 0, index: 0 }, ORIGIN)).toThrow(
      "a vertex handle doesn't move a circle",
    );
  });

  it("never changes the geometry it was given", () => {
    const frozen = structuredClone(polygon);
    deepFreeze(frozen);
    expect(() => editedBy(frozen, { kind: "midpoint", ring: 1, index: 3 }, ORIGIN)).not.toThrow();
    expect(frozen).toEqual(polygon);
  });
});

function deepFreeze(value: unknown): void {
  if (typeof value !== "object" || value === null) return;
  Object.freeze(value);
  for (const item of Object.values(value)) deepFreeze(item);
}
