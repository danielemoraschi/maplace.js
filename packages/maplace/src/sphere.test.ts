import { describe, expect, it } from "vitest";
import { EARTH_RADIUS, metresBetween } from "./sphere";

/** Metres in a degree of a great circle on the sphere maplace measures on. */
const METRES_PER_DEGREE = (EARTH_RADIUS * Math.PI) / 180;

describe("metresBetween", () => {
  it("measures a degree of longitude on the equator as a degree's metres", () => {
    expect(metresBetween({ lat: 0, lng: 0 }, { lat: 0, lng: 1 })).toBeCloseTo(METRES_PER_DEGREE, 3);
  });

  it("measures across ±180 the short way", () => {
    const across = metresBetween({ lat: 0, lng: 179.5 }, { lat: 0, lng: -179.5 });
    expect(across).toBeCloseTo(METRES_PER_DEGREE, 3);
  });
});
