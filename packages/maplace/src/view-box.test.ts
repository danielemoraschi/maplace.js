import { describe, expect, it } from "vitest";
import { hasArea, isInBox, unwrapped } from "./view-box";

describe("isInBox", () => {
  it("finds a point in a view across the antimeridian given as unwrapped longitudes", () => {
    const box = { south: -10, west: 170, north: 10, east: 190 };
    expect(isInBox({ lat: 0, lng: -175 }, box)).toBe(true);
    expect(isInBox({ lat: 0, lng: 175 }, box)).toBe(true);
    expect(isInBox({ lat: 0, lng: 165 }, box)).toBe(false);
    expect(isInBox({ lat: 11, lng: 175 }, box)).toBe(false);
  });
});

describe("unwrapped", () => {
  it("unwraps bounds across the antimeridian past 180, and leaves others as they are", () => {
    expect(unwrapped({ south: -10, west: 170, north: 10, east: -170 })).toEqual({
      south: -10,
      west: 170,
      north: 10,
      east: 190,
    });
    const plain = { south: 10, west: 20, north: 30, east: 60 };
    expect(unwrapped(plain)).toEqual(plain);
  });
});

describe("hasArea", () => {
  it("has area only with width and height", () => {
    expect(hasArea({ south: 10, west: 20, north: 10, east: 60 })).toBe(false);
    expect(hasArea({ south: 10, west: 20, north: 30, east: 20 })).toBe(false);
    expect(hasArea({ south: 10, west: 20, north: 30, east: 60 })).toBe(true);
    expect(hasArea({ south: 10, west: 170, north: 30, east: -170 })).toBe(true);
  });
});
