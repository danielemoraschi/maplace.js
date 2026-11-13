import { describe, expect, it } from "vitest";
import type { Location } from "../location";
import { metresBetween } from "../sphere";
import { distanceLabelIn, distanceTo, sortedByDistance } from "./distance";

const origin = { lat: 0, lng: 0 };
const metresTo = (lat: number, lng: number) => metresBetween(origin, { lat, lng });

describe("distanceTo", () => {
  it("measures a marker, a circle's centre, a polygon's bounds' centre and halfway along a line", () => {
    expect(distanceTo(origin, { id: "m", lat: 1, lng: 0 })).toBe(metresTo(1, 0));
    const circle: Location = { id: "c", type: "circle", center: { lat: 2, lng: 0 }, radius: 9 };
    expect(distanceTo(origin, circle)).toBe(metresTo(2, 0));
    const path = [
      { lat: 2, lng: -1 },
      { lat: 2, lng: 1 },
      { lat: 4, lng: 1 },
      { lat: 4, lng: -1 },
    ];
    expect(distanceTo(origin, { id: "p", type: "polygon", path })).toBe(metresTo(3, 0));
    const line = { id: "l", type: "polyline", path: [path[0], path[1]] } as Location;
    expect(distanceTo(origin, line)).toBeCloseTo(metresTo(2, 0), 3);
  });

  it("refuses lon, naming distanceTo, rather than returning NaN", () => {
    const bad = { lat: 1, lon: 2 } as never;
    expect(() => distanceTo(bad, { id: "m", lat: 1, lng: 0 })).toThrow(/distanceTo: origin/);
  });
});

describe("a curved polyline's distance", () => {
  const arc: Location = {
    id: "arc",
    type: "polyline",
    path: [
      { lat: 0, lng: -20 },
      { lat: 0, lng: 20 },
    ],
    curve: 0.5,
  };
  const middleOfArc = metresTo(10, 0);

  it("is measured, and sorted nearest-first, by the middle of its arc, where its popup points", () => {
    expect(distanceTo(origin, arc)).toBeCloseTo(middleOfArc, -3);
    const between: Location = { id: "m", lat: 5, lng: 0 };
    const { listing, distances } = sortedByDistance([arc, between], origin, String);
    expect(listing.map(({ id }) => id)).toEqual(["m", "arc"]);
    expect(distances.of.get("arc")?.metres).toBeCloseTo(middleOfArc, -3);
  });
});

describe("distanceTo: the location", () => {
  it.for([
    ["a latitude that isn't a number", { id: "m", lat: "x", lng: 0 }],
    ["an unknown type", { id: "m", type: "nope" }],
  ] as const)("refuses %s, naming distanceTo, rather than returning NaN", ([, bad]) => {
    expect(() => distanceTo(origin, bad as never)).toThrow(/distanceTo: location/);
  });
});

describe("sortedByDistance", () => {
  it("sorts nearest first, ties in data order, and says how far each is", () => {
    const far = { id: "far", lat: 5, lng: 0 };
    const tieOne = { id: "one", lat: 1, lng: 0 };
    const tieTwo = { id: "two", lat: 1, lng: 0 };
    const { listing, distances } = sortedByDistance([far, tieOne, tieTwo], origin, String);
    expect(listing.map(({ id }) => id)).toEqual(["one", "two", "far"]);
    expect(distances.from).toBe(origin);
    expect(distances.of.get("far")?.metres).toBe(metresTo(5, 0));
    expect(distances.of.get("far")?.label).toBe(String(metresTo(5, 0)));
  });
});

describe("distanceLabelIn", () => {
  const nonBreaking = (text: string) => text.replaceAll(" ", " ");

  it("writes 850 m as 0.85 km and 12,340 m as 12 km, kilometres by default", () => {
    const label = distanceLabelIn();
    expect(nonBreaking(label(850))).toBe("0.85 km");
    expect(nonBreaking(label(12_340))).toBe("12 km");
  });

  it("writes miles", () => {
    expect(nonBreaking(distanceLabelIn("mile")(500))).toBe("0.31 mi");
  });
});
