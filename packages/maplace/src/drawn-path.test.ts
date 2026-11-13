import { describe, expect, it } from "vitest";
import { drawnPath, SAMPLES_PER_SEGMENT } from "./drawn-path";
import type { LatLng } from "./geometry";
import type { PolylineLocation } from "./location";
import { wrapLongitude } from "./longitude-arc";

const line = (path: readonly LatLng[], curve?: number): PolylineLocation => ({
  id: "l",
  type: "polyline",
  path,
  curve,
});

const geodesicLine = (path: readonly LatLng[], curve?: number): PolylineLocation => ({
  ...line(path, curve),
  geodesic: true,
});

const LONDON_TO_TOKYO: readonly LatLng[] = [
  { lat: 51.5074, lng: -0.1278 },
  { lat: 35.6895, lng: 139.6917 },
];

const EAST: readonly LatLng[] = [
  { lat: 0, lng: 0 },
  { lat: 0, lng: 40 },
];

const HALFWAY = SAMPLES_PER_SEGMENT / 2;

/** The sample halfway along a path's first bowed segment. */
const middleOf = (path: readonly LatLng[]) => path[HALFWAY] as LatLng;

describe("drawnPath", () => {
  it("draws a polyline without a curve or geodesic along its own path", () => {
    expect(drawnPath(line(EAST))).toBe(EAST);
    expect(drawnPath(line(EAST, 0))).toBe(EAST);
    expect(drawnPath({ ...line(EAST), geodesic: false })).toBe(EAST);
  });

  it("leaves a path too short to bow as it is, for a caller that didn't validate it", () => {
    const one = [{ lat: 0, lng: 0 }];
    expect(drawnPath(line(one, 0.3))).toBe(one);
  });

  it("bows a two-point line to the left by its curve", () => {
    const drawn = drawnPath(line(EAST, 0.5));
    expect(drawn).toHaveLength(SAMPLES_PER_SEGMENT + 1);
    expect(drawn[0]).toEqual(EAST[0]);
    expect(drawn.at(-1)).toEqual(EAST[1]);
    // Going east, left is north: the control point is 0.5 × 40° above the midpoint, the curve
    // passes halfway to it.
    expect(middleOf(drawn).lng).toBeCloseTo(20);
    expect(middleOf(drawn).lat).toBeCloseTo(10);
  });

  it("bows to the right with a negative curve", () => {
    expect(middleOf(drawnPath(line(EAST, -0.5))).lat).toBeCloseTo(-10);
  });

  it("bows each segment of a longer path", () => {
    const path = [...EAST, { lat: 40, lng: 40 }];
    const drawn = drawnPath(line(path, 0.5));
    expect(drawn).toHaveLength(2 * SAMPLES_PER_SEGMENT + 1);
    expect(drawn[SAMPLES_PER_SEGMENT]).toEqual(path[1]);
    // Going north, left is west.
    expect(drawn[SAMPLES_PER_SEGMENT + HALFWAY]?.lng).toBeCloseTo(30);
    expect(drawn[SAMPLES_PER_SEGMENT + HALFWAY]?.lat).toBeCloseTo(20);
  });

  it("crosses ±180 the short way", () => {
    const shanghaiToLosAngeles = [
      { lat: 31.23, lng: 121.47 },
      { lat: 34.05, lng: -118.24 },
    ];
    const drawn = drawnPath(line(shanghaiToLosAngeles, 0.2));
    for (const [index, point] of drawn.entries()) {
      expect(point.lng, `${index}`).toBeGreaterThanOrEqual(-180);
      expect(point.lng, `${index}`).toBeLessThan(180);
      const next = drawn[index + 1];
      if (next) expect(Math.abs(wrapLongitude(next.lng - point.lng)), `${index}`).toBeLessThan(10);
    }
    expect(drawn.some(({ lng }) => lng > 170)).toBe(true);
    expect(drawn.some(({ lng }) => lng < -170)).toBe(true);
  });

  it("keeps its latitude within ±90", () => {
    const nearThePole = [
      { lat: 80, lng: 0 },
      { lat: 80, lng: 100 },
    ];
    const drawn = drawnPath(line(nearThePole, 1));
    expect(Math.max(...drawn.map(({ lat }) => lat))).toBe(90);
  });

  it("gives the same path again for the same path and curve, a new one for a new curve", () => {
    const left = drawnPath(line(EAST, 0.3));
    expect(drawnPath(line(EAST, 0.3))).toBe(left);
    expect(drawnPath(line(EAST, -0.3))).not.toBe(left);
  });

  it("draws a geodesic line along great circles", () => {
    const drawn = drawnPath(geodesicLine(LONDON_TO_TOKYO));
    // A point a degree of arc: 86 steps and the end.
    expect(drawn).toHaveLength(87);
    expect(drawn[drawn.length >> 1]?.lat).toBeCloseTo(69, 0);
    expect(drawn.at(-1)).toEqual(LONDON_TO_TOKYO[1]);
  });

  it("draws a short geodesic hop as its two ends", () => {
    const hop = [LONDON_TO_TOKYO[0] as LatLng, { lat: 51.5, lng: 0 }];
    expect(drawnPath(geodesicLine(hop))).toEqual(hop);
  });

  it("keeps a geodesic drawing apart from a curved one on the same path", () => {
    const bowed = drawnPath(line(LONDON_TO_TOKYO, 0.2));
    const geodesic = drawnPath(geodesicLine(LONDON_TO_TOKYO));
    expect(geodesic).not.toBe(bowed);
    expect(drawnPath(geodesicLine(LONDON_TO_TOKYO))).toBe(geodesic);
  });

  it("takes geodesic over curve for a line no one validated", () => {
    expect(drawnPath(geodesicLine(LONDON_TO_TOKYO, 0.2))).toBe(
      drawnPath(geodesicLine(LONDON_TO_TOKYO)),
    );
  });

  it("draws a geodesic segment straight where no single great circle joins its points", () => {
    const antipodes = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 180 },
    ];
    expect(middleOf(drawnPath(geodesicLine(antipodes)))).toEqual({ lat: 0, lng: -90 });
  });

  it("freezes what it gives, points included", () => {
    const drawn = drawnPath(line(EAST, 0.4));
    expect(Object.isFrozen(drawn)).toBe(true);
    expect(drawn.every(Object.isFrozen)).toBe(true);
  });
});
