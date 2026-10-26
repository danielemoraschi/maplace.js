import { describe, expect, it } from "vitest";
import { isInside, paddedView, WHOLE_WORLD } from "./cluster-view";

describe("paddedView", () => {
  it("pads a view by half of it each side, as MapLibre keeps its markers", () => {
    expect(paddedView({ south: 10, west: 20, north: 14, east: 28 })).toEqual([16, 8, 32, 16]);
  });

  it.each([
    ["a map showing the world more than once", { south: -85, west: -180, north: 85, east: 180 }],
    ["a view half a world wide", { south: -60, west: -90, north: 60, east: 90 }],
  ])("is the whole world once the padded view spans it, as for %s", (_, bounds) => {
    expect(paddedView(bounds)).toEqual(WHOLE_WORLD);
  });

  it("is the whole world for bounds with no area, as a map not yet laid out reports", () => {
    expect(paddedView({ south: 0, west: 10, north: 0, east: 10 })).toEqual(WHOLE_WORLD);
    expect(paddedView({ south: 5, west: 10, north: 5, east: 20 })).toEqual(WHOLE_WORLD);
  });

  it("pads a view across the antimeridian on from its west, past 180", () => {
    expect(paddedView({ south: 0, west: 178, north: 2, east: -178 })).toEqual([176, -1, 184, 3]);
  });
});

describe("isInside", () => {
  it("reads Google's bounds across the antimeridian against an unwrapped box", () => {
    const across = paddedView({ south: 0, west: 178, north: 2, east: -178 });
    expect(isInside({ south: 0, west: -179.5, north: 2, east: -177 }, across)).toBe(true);
    expect(isInside({ south: 0, west: -170, north: 2, east: -160 }, across)).toBe(false);
  });
});
