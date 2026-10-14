import { describe, expect, it } from "vitest";
import type { LatLng } from "../geometry";
import { anchorOf } from "./anchor";

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
