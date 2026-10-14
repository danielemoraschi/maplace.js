import { describe, expect, it } from "vitest";
import { arcSpan, wrapLongitude } from "./longitude-arc";

describe("wrapLongitude", () => {
  it("brings longitudes into -180..180", () => {
    expect([190, -190, 540, 20].map(wrapLongitude)).toEqual([-170, 170, -180, 20]);
  });
});

describe("arcSpan", () => {
  it("measures an arc, across ±180 when west is greater than east", () => {
    expect(arcSpan({ west: -10, east: 30 })).toBe(40);
    expect(arcSpan({ west: 170, east: -170 })).toBe(20);
  });
});
