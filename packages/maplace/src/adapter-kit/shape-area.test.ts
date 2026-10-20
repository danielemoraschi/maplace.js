import { describe, expect, it } from "vitest";
import type { LatLng } from "../geometry";
import { areaOf } from "./shape-area";

/** A square `size` degrees wide from the origin, counter-clockwise. */
const square = (size: number): LatLng[] => [
  { lat: 0, lng: 0 },
  { lat: 0, lng: size },
  { lat: size, lng: size },
  { lat: size, lng: 0 },
];

/** A degree along the equator, in metres. */
const DEGREE = 111_195;

describe("areaOf", () => {
  it("is a circle's area in square metres", () => {
    expect(areaOf({ type: "circle", center: { lat: 0, lng: 0 }, radius: 1000 })).toBeCloseTo(
      Math.PI * 1e6,
    );
  });

  it("is a polygon's area on the globe, whichever way round its path goes", () => {
    const area = areaOf({ type: "polygon", path: square(1) });
    expect(area / DEGREE ** 2).toBeCloseTo(1, 2);
    expect(areaOf({ type: "polygon", path: square(1).reverse() })).toBeCloseTo(area);
  });

  it("is a polygon's outline, holes and all: what a shape inside it lies within", () => {
    const whole = areaOf({ type: "polygon", path: square(2) });
    expect(areaOf({ type: "polygon", path: square(2), holes: [square(3)] })).toBe(whole);
  });

  it("takes the short way across ±180, as the map draws it", () => {
    const across = [
      { lat: 0, lng: 179.5 },
      { lat: 0, lng: -179.5 },
      { lat: 1, lng: -179.5 },
      { lat: 1, lng: 179.5 },
    ];
    expect(areaOf({ type: "polygon", path: across }) / DEGREE ** 2).toBeCloseTo(1, 2);
  });

  it("is nothing for a line or a marker", () => {
    expect(areaOf({ type: "polyline", path: square(1) })).toBe(0);
    expect(areaOf({ type: "marker", lat: 0, lng: 0 })).toBe(0);
  });
});
