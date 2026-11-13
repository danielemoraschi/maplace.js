import { describe, expect, it } from "vitest";
import type { LatLng } from "./geometry";
import { greatCircleSegment, type SegmentPath } from "./great-circle";
import { wrapLongitude } from "./longitude-arc";

const LONDON = { lat: 51.5074, lng: -0.1278 };
const TOKYO = { lat: 35.6895, lng: 139.6917 };

/** The great circle from `from` to `to`, failing where there is no single one. */
function circle(from: LatLng, to: LatLng): SegmentPath["at"] {
  const segment = greatCircleSegment(from, to);
  if (segment === undefined) throw new Error("no single great circle");
  return segment.at;
}

/** `segment` at 0, 1/64, … 1. */
function samplesOf(segment: SegmentPath["at"]): LatLng[] {
  return Array.from({ length: 65 }, (_, step) => segment(step / 64));
}

describe("greatCircleSegment", () => {
  it("follows the great circle: London to Tokyo's middle is near 69°N", () => {
    expect(circle(LONDON, TOKYO)(0.5).lat).toBeCloseTo(69, 0);
  });

  it("takes a step a degree of arc: one for a short hop, 86 for London to Tokyo", () => {
    expect(greatCircleSegment(LONDON, { lat: 51.5, lng: 0 })?.steps).toBe(1);
    expect(greatCircleSegment(LONDON, TOKYO)?.steps).toBe(86);
  });

  it("keeps both ends", () => {
    const segment = circle(LONDON, TOKYO);
    expect(segment(0).lat).toBeCloseTo(LONDON.lat, 9);
    expect(segment(0).lng).toBeCloseTo(LONDON.lng, 9);
    expect(segment(1).lat).toBeCloseTo(TOKYO.lat, 9);
    expect(segment(1).lng).toBeCloseTo(TOKYO.lng, 9);
  });

  it("crosses ±180 the short way", () => {
    const shanghai = { lat: 31.23, lng: 121.47 };
    const losAngeles = { lat: 34.05, lng: -118.24 };
    const samples = samplesOf(circle(shanghai, losAngeles));
    for (const [index, point] of samples.slice(1).entries()) {
      const step = wrapLongitude(point.lng - (samples[index] as LatLng).lng);
      expect(Math.abs(step), `${index}`).toBeLessThan(10);
    }
  });

  it("passes over the pole: (80, 0) to (80, 180) reaches 90°, with no NaN", () => {
    const samples = samplesOf(circle({ lat: 80, lng: 0 }, { lat: 80, lng: 180 }));
    expect(samples.every(({ lat, lng }) => Number.isFinite(lat) && Number.isFinite(lng))).toBe(
      true,
    );
    expect(Math.max(...samples.map(({ lat }) => lat))).toBeCloseTo(90, 6);
  });

  it("has none between identical points, written two ways (10, 180) and (10, -180)", () => {
    expect(greatCircleSegment({ lat: 10, lng: 180 }, { lat: 10, lng: -180 })).toBeUndefined();
  });

  it("has none between antipodes (0, 0)–(0, 180) and (10, 20)–(-10, -160)", () => {
    expect(greatCircleSegment({ lat: 0, lng: 0 }, { lat: 0, lng: 180 })).toBeUndefined();
    expect(greatCircleSegment({ lat: 10, lng: 20 }, { lat: -10, lng: -160 })).toBeUndefined();
  });
});
