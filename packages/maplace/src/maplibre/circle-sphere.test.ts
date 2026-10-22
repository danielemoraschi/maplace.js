import { describe, expect, it } from "vitest";
import { EARTH_RADIUS } from "../adapter-kit/shape-area";
import { ORIGIN } from "../testing/conformance/fixtures";
import { CIRCLE_SEGMENTS, circleRing, metresBetween, pointAtBearing } from "./circle-sphere";

/** Metres in a degree of a great circle on the sphere maplace measures on. */
const METRES_PER_DEGREE = (EARTH_RADIUS * Math.PI) / 180;

describe("circleRing", () => {
  const circle = { type: "circle", center: { lat: 45, lng: 10 }, radius: 15_000 } as const;

  it("gives one position per segment and the first again, as GeoJSON closes a ring", () => {
    const ring = circleRing(circle);
    expect(ring).toHaveLength(CIRCLE_SEGMENTS + 1);
    expect(ring.at(-1)).toEqual(ring[0]);
  });

  it("puts every point radius metres from the centre", () => {
    for (const [lng = 0, lat = 0] of circleRing(circle)) {
      const metres = metresBetween(circle.center, { lat, lng });
      expect(Math.abs(metres - circle.radius) / circle.radius).toBeLessThan(1e-6);
    }
  });

  it("runs on past 180 for a circle across the antimeridian", () => {
    const across = { type: "circle", center: { lat: 0, lng: 179.99 }, radius: 5000 } as const;
    const longitudes = circleRing(across).map(([lng = 0]) => lng);
    expect(longitudes.some((lng) => lng > 180)).toBe(true);
    expect(longitudes.every((lng) => lng > 0)).toBe(true);
  });
});

describe("pointAtBearing", () => {
  it("goes a degree of latitude north in a degree's metres", () => {
    const north = pointAtBearing(ORIGIN, METRES_PER_DEGREE, 0);
    expect(north.lat).toBeCloseTo(1, 6);
    expect(north.lng).toBeCloseTo(0, 6);
  });

  it("wraps a point past 180 back to -180..180", () => {
    const east = pointAtBearing({ lat: 0, lng: 179.5 }, METRES_PER_DEGREE, 90);
    expect(east.lng).toBeCloseTo(-179.5, 6);
  });
});

describe("metresBetween", () => {
  it("measures a degree of longitude on the equator as a degree's metres", () => {
    expect(metresBetween(ORIGIN, { lat: 0, lng: 1 })).toBeCloseTo(METRES_PER_DEGREE, 3);
  });

  it("measures across ±180 the short way", () => {
    const across = metresBetween({ lat: 0, lng: 179.5 }, { lat: 0, lng: -179.5 });
    expect(across).toBeCloseTo(METRES_PER_DEGREE, 3);
  });
});
