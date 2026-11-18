import { describe, expect, it } from "vitest";
import { pointAtFraction, splitAtFraction } from "./along";
import { anchorOf } from "./anchor";
import { drawnPath } from "./drawn-path";

const EQUATOR = [
  { lat: 0, lng: 0 },
  { lat: 0, lng: 1 },
  { lat: 0, lng: 3 },
];

describe("a point along a path", () => {
  it("is the path's first point at 0 and its last at 1", () => {
    expect(pointAtFraction(EQUATOR, 0)).toEqual({ lat: 0, lng: 0 });
    expect(pointAtFraction(EQUATOR, 1)).toEqual({ lat: 0, lng: 3 });
  });

  it("is placed by length, not by points", () => {
    expect(pointAtFraction(EQUATOR, 0.5)).toEqual({ lat: 0, lng: 1.5 });
    expect(pointAtFraction(EQUATOR, 0.25)).toEqual({ lat: 0, lng: 0.75 });
  });

  it("is a line's popup anchor halfway, a bowed line's too", () => {
    const line = { id: "l", type: "polyline", path: EQUATOR, curve: 0.5 } as const;
    expect(pointAtFraction(drawnPath(line), 0.5)).toEqual(anchorOf(line));
  });

  it("runs on across ±180, the short way", () => {
    const across = [
      { lat: 0, lng: 179 },
      { lat: 0, lng: -179 },
    ];
    expect(Math.abs(pointAtFraction(across, 0.5).lng)).toBeCloseTo(180);
    expect(pointAtFraction(across, 0.75).lng).toBeCloseTo(-179.5);
  });
});

describe("a point along a line past Mercator's reach", () => {
  it("is placed on the line, not clamped to 85.05° as the map's plane is", () => {
    const polar = [
      { lat: 87, lng: 0 },
      { lat: 88, lng: 0 },
    ];
    expect(pointAtFraction(polar, 0.5).lat).toBeCloseTo(87.5);
  });
});

describe("a path split at a fraction", () => {
  it("splits a long straight segment on the line drawn, straight in Web Mercator", () => {
    const y = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
    const diagonal = [
      { lat: 0, lng: 0 },
      { lat: 60, lng: 60 },
    ];
    const at = splitAtFraction(diagonal, 0.5).travelled.at(-1) ?? { lat: 0, lng: 0 };
    expect(y(at.lat) / at.lng).toBeCloseTo(y(60) / 60, 10);
  });

  it("splits into a travelled part and the part ahead, meeting at the point", () => {
    const { travelled, ahead } = splitAtFraction(EQUATOR, 0.5);
    expect(travelled).toEqual([
      { lat: 0, lng: 0 },
      { lat: 0, lng: 1 },
      { lat: 0, lng: 1.5 },
    ]);
    expect(ahead).toEqual([
      { lat: 0, lng: 1.5 },
      { lat: 0, lng: 3 },
    ]);
  });

  it("gives the same parts again for the same path and fraction, so a redraw sends nothing new", () => {
    expect(splitAtFraction(EQUATOR, 0.4)).toBe(splitAtFraction(EQUATOR, 0.4));
  });

  it("keeps every point of the path, in order, across the two parts", () => {
    const { travelled, ahead } = splitAtFraction(EQUATOR, 0.2);
    expect([...travelled.slice(0, -1), ...ahead.slice(1)]).toEqual(EQUATOR);
  });
});
