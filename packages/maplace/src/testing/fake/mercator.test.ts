import { describe, expect, it } from "vitest";
import { boundsAround, fitBox, MAX_ZOOM } from "./mercator";

const size = { width: 512, height: 512 };

describe("boundsAround", () => {
  it("spans 360 × width / (256 × 2^zoom) degrees of longitude around the centre", () => {
    const bounds = boundsAround({ center: { lat: 0, lng: 10 }, zoom: 4 }, size);
    expect(bounds.west).toBeCloseTo(-12.5);
    expect(bounds.east).toBeCloseTo(32.5);
    expect(bounds.north).toBeCloseTo(-bounds.south);
  });

  it("crosses ±180° with west > east near the antimeridian", () => {
    const bounds = boundsAround({ center: { lat: 0, lng: 175 }, zoom: 4 }, size);
    expect(bounds.west).toBeCloseTo(152.5);
    expect(bounds.east).toBeCloseTo(-162.5);
  });

  it("reports the whole world once the view is wider than it", () => {
    const bounds = boundsAround({ center: { lat: 0, lng: 50 }, zoom: 0 }, size);
    expect([bounds.west, bounds.east]).toEqual([-180, 180]);
  });

  it("stops at Mercator's latitudes near a pole", () => {
    const bounds = boundsAround({ center: { lat: 89, lng: 0 }, zoom: 1 }, size);
    expect(bounds.north).toBeLessThanOrEqual(85.06);
  });
});

describe("fitBox", () => {
  it("centres on a box across ±180° and zooms to show all of it", () => {
    const camera = fitBox({ south: -20, west: 170, north: 0, east: -170 }, { size, padding: 40 });
    expect(Math.abs(camera.center.lng)).toBeCloseTo(180);
    const shown = boundsAround(camera, size);
    expect(shown.west).toBeLessThanOrEqual(170);
    expect(shown.east).toBeGreaterThanOrEqual(-170);
  });

  it("caps the zoom for a box with no size, and floors it for padding wider than the map", () => {
    const point = { south: 10, west: 20, north: 10, east: 20 };
    expect(fitBox(point, { size, padding: 40 }).zoom).toBe(MAX_ZOOM);
    const world = { south: -60, west: -170, north: 60, east: 170 };
    expect(fitBox(world, { size, padding: 300 }).zoom).toBe(0);
  });
});
