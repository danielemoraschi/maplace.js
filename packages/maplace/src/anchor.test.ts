import { describe, expect, it } from "vitest";
import { anchorOf } from "./anchor";
import type { LatLng } from "./geometry";

function square(center: LatLng, half: number): LatLng[] {
  const { lat, lng } = center;
  return [
    { lat: lat - half, lng: lng - half },
    { lat: lat - half, lng: lng + half },
    { lat: lat + half, lng: lng + half },
    { lat: lat + half, lng: lng - half },
  ];
}

describe("anchorOf", () => {
  it("reads a location without a type as a marker", () => {
    expect(anchorOf({ id: "a", lat: 1, lng: 2 })).toEqual({ lat: 1, lng: 2 });
  });

  it("reads a circle, polygon and polyline location as their geometries", () => {
    const center = { lat: 3, lng: 4 };
    expect(anchorOf({ id: "c", type: "circle", center, radius: 10 })).toEqual(center);
    const path = square({ lat: 10, lng: 20 }, 1);
    expect(anchorOf({ id: "p", type: "polygon", path })).toEqual({ lat: 10, lng: 20 });
    const ends = [
      { lat: 0, lng: 0 },
      { lat: 2, lng: 0 },
    ];
    expect(anchorOf({ id: "l", type: "polyline", path: ends })).toEqual({ lat: 1, lng: 0 });
  });

  it("anchors a marker at its point, and a circle at its centre", () => {
    expect(anchorOf({ type: "marker", lat: 1, lng: 2 })).toEqual({ lat: 1, lng: 2 });
    expect(anchorOf({ type: "circle", center: { lat: 3, lng: 4 }, radius: 10 })).toEqual({
      lat: 3,
      lng: 4,
    });
  });

  it("anchors a polygon at the centre of its outer ring's bounds, whatever its holes", () => {
    const path = square({ lat: 10, lng: 20 }, 1);
    const holes = [square({ lat: 10.5, lng: 20.5 }, 0.1)];
    expect(anchorOf({ type: "polygon", path, holes })).toEqual({ lat: 10, lng: 20 });
  });

  it("anchors a polygon across ±180 on the antimeridian, not on the other side of the world", () => {
    const path = square({ lat: 0, lng: 180 }, 10).map(({ lat, lng }) => ({
      lat,
      lng: lng > 180 ? lng - 360 : lng,
    }));
    expect(Math.abs(anchorOf({ type: "polygon", path }).lng)).toBe(180);
  });

  it("anchors a polyline halfway along its path, on the line", () => {
    const two = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 2 },
    ];
    expect(anchorOf({ type: "polyline", path: two })).toEqual({ lat: 0, lng: 1 });
    const bent = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 1 },
      { lat: 0, lng: 4 },
    ];
    expect(anchorOf({ type: "polyline", path: bent })).toEqual({ lat: 0, lng: 2 });
  });

  it("measures a polyline across ±180 the short way", () => {
    const path = [
      { lat: 0, lng: 179 },
      { lat: 0, lng: -179 },
    ];
    expect(Math.abs(anchorOf({ type: "polyline", path }).lng)).toBe(180);
  });
});
