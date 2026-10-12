import { describe, expect, it } from "vitest";
import type { Location } from "../location";
import { boundsAround } from "./bounds";

const marker = (id: string, lat: number, lng: number): Location => ({ id, lat, lng });
const circle = (lat: number, lng: number, radius: number): Location => ({
  id: "c",
  type: "circle",
  center: { lat, lng },
  radius,
});

describe("boundsAround", () => {
  it("is undefined without locations", () => {
    expect(boundsAround([])).toBeUndefined();
  });

  it("is a zero-size box around a single marker", () => {
    expect(boundsAround([marker("a", 45, 9)])).toEqual({ south: 45, west: 9, north: 45, east: 9 });
  });

  it("spans markers and every point of a path", () => {
    const line: Location = {
      id: "l",
      type: "polyline",
      path: [
        { lat: 10, lng: 20 },
        { lat: -5, lng: 30 },
      ],
    };
    expect(boundsAround([marker("a", 40, 0), line])).toEqual({
      south: -5,
      west: 0,
      north: 40,
      east: 30,
    });
  });

  it("crosses ±180 when that box is narrower, with west greater than east", () => {
    const fiji = [marker("a", -17, 178), marker("b", -16, -179)];
    expect(boundsAround(fiji)).toEqual({ south: -17, west: 178, north: -16, east: -179 });
  });

  it("keeps the box within ±180 when that one is narrower", () => {
    const wide = [marker("a", 0, -60), marker("b", 0, 60)];
    expect(boundsAround(wide)).toMatchObject({ west: -60, east: 60 });
  });

  it("reaches as far as a circle's radius, widening longitude away from the equator", () => {
    const atEquator = boundsAround([circle(0, 0, 111_195)]);
    expect(atEquator?.north).toBeCloseTo(1, 3);
    expect(atEquator?.east).toBeCloseTo(1, 3);
    const at60 = boundsAround([circle(60, 0, 111_195)]);
    expect(at60?.north).toBeCloseTo(61, 3);
    expect(at60?.east).toBeCloseTo(2, 3);
  });

  it("wraps a circle over ±180 into a crossing box", () => {
    const bounds = boundsAround([circle(0, 179.5, 111_195)]);
    expect(bounds?.west).toBeCloseTo(178.5, 3);
    expect(bounds?.east).toBeCloseTo(-179.5, 3);
  });

  it("takes every longitude for a circle over a pole", () => {
    expect(boundsAround([circle(89.5, 10, 111_195)])).toMatchObject({
      north: 90,
      west: -180,
      east: 180,
    });
  });
});
