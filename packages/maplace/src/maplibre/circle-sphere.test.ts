import { describe, expect, it } from "vitest";
import { EARTH_RADIUS } from "../adapter-kit/shape-area";
import type { LatLng } from "../geometry";
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

  /** 22.5° of arc from ±75°: round the pole, to ±82.5° past it, short of Mercator's 85.05°. */
  const roundPole = (center: LatLng) =>
    ({ type: "circle", center, radius: METRES_PER_DEGREE * 22.5 }) as const;

  it("covers the north pole, up to the map's top edge, for a circle round it", () => {
    const ring = circleRing(roundPole({ lat: 75, lng: 10 }));
    expect(isInside(ring, [10, 84])).toBe(true);
    expect(isInside(ring, [-165, 84])).toBe(true);
    expect(isInside(ring, [10, 50])).toBe(false);
  });

  it("covers the south pole, down to the map's bottom edge, for a circle round it", () => {
    const ring = circleRing(roundPole({ lat: -75, lng: 10 }));
    expect(isInside(ring, [10, -84])).toBe(true);
    expect(isInside(ring, [-165, -84])).toBe(true);
    expect(isInside(ring, [10, -50])).toBe(false);
  });

  /** 120° of arc from the equator: round both poles, leaving a cap of 60° round the antipode. */
  const roundBothPoles = {
    type: "circle",
    center: { lat: 0, lng: 10 },
    radius: METRES_PER_DEGREE * 120,
  } as const;

  it("covers both poles and leaves the cap round the antipode out, for a circle wider than a hemisphere", () => {
    const ring = circleRing(roundBothPoles);
    for (const inside of [
      [10, 0],
      [10, 84],
      [-165, 84],
      [10, -84],
      [-100, 0],
    ])
      expect(isInside(ring, inside)).toBe(true);
    for (const outside of [
      [-160, 0],
      [-120, 0],
      [160, 0],
    ])
      expect(isInside(ring, outside)).toBe(false);
  });

  it("puts every point but the poles' radius metres from the centre, for a circle round both", () => {
    const { center, radius } = roundBothPoles;
    for (const [lng = 0, lat = 0] of circleRing(roundBothPoles).filter(
      ([, lat]) => Math.abs(lat ?? 0) !== 90,
    )) {
      const metres = metresBetween(center, { lat, lng });
      expect(Math.abs(metres - radius) / radius).toBeLessThan(1e-6);
    }
  });

  it("draws a circle centred on a pole as the parallel round it", () => {
    const ring = circleRing(roundPole({ lat: 90, lng: 10 }));
    for (const lng of [10, 55, 100, -35, -125]) expect(isInside(ring, [lng, 70])).toBe(true);
    expect(isInside(ring, [55, 60])).toBe(false);
  });
});

/**
 * Whether `[lng, lat]` is inside `ring` as MapLibre fills it, on the plane of its positions as
 * given (even-odd), in the world copy the ring runs through or the next.
 */
function isInside(ring: GeoJSON.Position[], [lng = 0, lat = 0]: GeoJSON.Position): boolean {
  const crossings = (x: number) =>
    ring.slice(1).filter(([x1 = 0, y1 = 0], index) => {
      const [x0 = 0, y0 = 0] = ring[index] ?? [];
      if (y0 > lat === y1 > lat) return false;
      return x < x0 + ((lat - y0) * (x1 - x0)) / (y1 - y0);
    }).length;
  return [lng - 360, lng, lng + 360].some((x) => crossings(x) % 2 === 1);
}

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
