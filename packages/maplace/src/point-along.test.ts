import { describe, expect, it } from "vitest";
import { anchorOf } from "./anchor";
import type { PolylineLocation } from "./location";
import { pointAlong } from "./point-along";
import type { RouteResult } from "./route";

const PATH = [
  { lat: 0, lng: 0 },
  { lat: 0, lng: 2 },
];
const LINE: PolylineLocation = { id: "l", type: "polyline", path: PATH };
const RESULT: RouteResult = { legs: [], distanceMeters: 0, durationSeconds: 0, path: PATH };

describe("pointAlong", () => {
  it("gives the point a fraction of the way along a polyline as it is drawn", () => {
    expect(pointAlong(LINE, 0.25)).toEqual({ lat: 0, lng: 0.5 });
    const bowed = { ...LINE, curve: 0.4 };
    expect(pointAlong(bowed, 0.5)).toEqual(anchorOf(bowed));
  });

  it("gives the point a fraction of the way along a route's path", () => {
    expect(pointAlong(RESULT, 1)).toEqual({ lat: 0, lng: 2 });
  });

  it("refuses a fraction outside 0 to 1", () => {
    expect(() => pointAlong(LINE, 1.5)).toThrow(
      expect.objectContaining({
        code: "invalid-input",
        message: "pointAlong: fraction must be a number from 0 to 1, got 1.5",
      }),
    );
  });

  it("refuses anything but a polyline location or a route result", () => {
    const marker = { id: "m", lat: 0, lng: 0 } as unknown as PolylineLocation;
    expect(() => pointAlong(marker, 0.5)).toThrow(
      /pointAlong: line must be a polyline location or a route result/,
    );
  });

  it("refuses a line with fewer than 2 points", () => {
    expect(() => pointAlong({ ...LINE, path: [PATH[0] as never] }, 0.5)).toThrow(
      /pointAlong: line\.path must be an array of at least 2 points, got 1 point/,
    );
  });

  it("checks a polyline's drawing as a location's, refusing a bow it can't draw", () => {
    expect(() => pointAlong({ ...LINE, curve: 5 }, 0.5)).toThrow(
      /pointAlong: line\.curve must be a number from -1 to 1, got 5/,
    );
  });
});
