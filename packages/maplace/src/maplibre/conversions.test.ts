import { describe, expect, it } from "vitest";
import {
  boundsOf,
  fromMapLibreZoom,
  nearestLongitude,
  toMapLibreZoom,
  wrappedLatLng,
  wrappedLongitude,
} from "./conversions";

/** Bounds as MapLibre's `LngLatBounds` gives them. */
const lngLatBounds = (west: number, south: number, east: number, north: number) =>
  ({
    getWest: () => west,
    getSouth: () => south,
    getEast: () => east,
    getNorth: () => north,
  }) as never;

describe("zoom", () => {
  it("is one less on MapLibre's 512-pixel tiles, both ways", () => {
    expect(toMapLibreZoom(15)).toBe(14);
    expect(fromMapLibreZoom(14)).toBe(15);
  });
});

describe("wrappedLongitude", () => {
  it("brings a world copy's longitude back into −180..180", () => {
    expect(wrappedLongitude(190)).toBe(-170);
    expect(wrappedLongitude(-190)).toBe(170);
    expect(wrappedLongitude(540)).toBe(180);
    expect(wrappedLongitude(20)).toBe(20);
    expect(wrappedLatLng({ lat: 1, lng: 380 })).toEqual({ lat: 1, lng: 20 });
  });
});

describe("nearestLongitude", () => {
  it("takes the short way across ±180 to the longitude it is near", () => {
    expect(nearestLongitude(-170, 170)).toBe(190);
    expect(nearestLongitude(170, -170)).toBe(-190);
  });

  it("keeps a longitude already within 180° of its neighbour as it is", () => {
    expect(nearestLongitude(0.6, 0)).toBe(0.6);
    expect(nearestLongitude(20, 10)).toBe(20);
  });
});

describe("boundsOf", () => {
  it("gives bounds within the world as they are", () => {
    expect(boundsOf(lngLatBounds(10, 20, 30, 40))).toEqual({
      south: 20,
      west: 10,
      north: 40,
      east: 30,
    });
  });

  it("gives bounds across ±180° with west > east", () => {
    expect(boundsOf(lngLatBounds(170, 0, 190, 10))).toEqual({
      south: 0,
      west: 170,
      north: 10,
      east: -170,
    });
  });

  it("gives a view as wide as the world, or wider, as the whole world", () => {
    expect(boundsOf(lngLatBounds(-300, -80, 300, 80))).toEqual({
      south: -80,
      west: -180,
      north: 80,
      east: 180,
    });
  });
});
