import { describe, expect, it } from "vitest";
import { frozenBounds, frozenPath, frozenPoint } from "./frozen";

describe("frozen copies", () => {
  it("copies only the coordinates and freezes them", () => {
    const point = { lat: 1, lng: 2, extra: true };
    const copy = frozenPoint(point);
    expect(copy).toEqual({ lat: 1, lng: 2 });
    expect(Object.isFrozen(copy)).toBe(true);
  });

  it("freezes a path and each of its points", () => {
    const path = frozenPath([{ lat: 1, lng: 2 }]);
    expect(Object.isFrozen(path) && Object.isFrozen(path[0])).toBe(true);
  });

  it("copies and freezes a box", () => {
    const bounds = { south: 1, west: 2, north: 3, east: 4 };
    const copy = frozenBounds(bounds);
    expect(copy).toEqual(bounds);
    expect(copy).not.toBe(bounds);
    expect(Object.isFrozen(copy)).toBe(true);
  });
});
