import { describe, expect, it } from "vitest";
import { arcSpan, wrapLongitude } from "./longitude-arc";

describe("wrapLongitude", () => {
  it("brings longitudes into -180..180", () => {
    expect([190, -190, 540, 20].map(wrapLongitude)).toEqual([-170, 170, -180, 20]);
  });

  it("returns a longitude already in -180..180 as it is, with no float error", () => {
    const inRange = [0.6, -179.4, 179.99, -180, 12.345678];
    expect(inRange.map(wrapLongitude)).toEqual(inRange);
  });

  it("takes 180 as -180, the range's other end", () => {
    expect(wrapLongitude(180)).toBe(-180);
  });
});

describe("arcSpan", () => {
  it("measures an arc, across ±180 when west is greater than east", () => {
    expect(arcSpan({ west: -10, east: 30 })).toBe(40);
    expect(arcSpan({ west: 170, east: -170 })).toBe(20);
  });
});
