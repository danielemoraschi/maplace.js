import { describe, expect, it } from "vitest";
import { boxContains, lngSpanAt, lngSpanOf } from "./geo";

const acrossDateLine = { south: -20, west: 170, north: 0, east: -170 };

describe("lngSpanAt", () => {
  it("halves with each zoom level, from the world twice over at zoom 0 on 512 px", () => {
    expect(lngSpanAt(0, 512)).toBe(720);
    expect(lngSpanAt(4, 512)).toBe(45);
  });
});

describe("lngSpanOf", () => {
  it("measures eastward, across ±180° when west > east", () => {
    expect(lngSpanOf({ south: 0, west: -10, north: 1, east: 10 })).toBe(20);
    expect(lngSpanOf(acrossDateLine)).toBe(20);
  });
});

describe("boxContains", () => {
  it("holds a box across ±180° inside a wider one", () => {
    expect(boxContains({ south: -30, west: 160, north: 10, east: -160 }, acrossDateLine)).toBe(
      true,
    );
  });

  it("refuses the same longitudes the other way round the world", () => {
    expect(boxContains({ south: -30, west: -170, north: 10, east: 170 }, acrossDateLine)).toBe(
      false,
    );
  });

  it("refuses a box reaching past the latitudes", () => {
    expect(boxContains({ south: -10, west: 160, north: 10, east: -160 }, acrossDateLine)).toBe(
      false,
    );
  });

  it("lets the whole world hold anything", () => {
    expect(boxContains({ south: -85, west: -180, north: 85, east: 180 }, acrossDateLine)).toBe(
      true,
    );
  });
});
