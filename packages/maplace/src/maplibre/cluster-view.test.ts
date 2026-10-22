import type { LngLatBounds, Map as MapLibreMap } from "maplibre-gl";
import { describe, expect, it } from "vitest";
import { clusterBoxOf, clusterZoomOf, isInBox } from "./cluster-view";

/** A map showing `south..north` and `west..east`, longitudes unwrapped as MapLibre gives them. */
function showing(south: number, west: number, north: number, east: number) {
  const bounds = {
    getSouth: () => south,
    getWest: () => west,
    getNorth: () => north,
    getEast: () => east,
  } as LngLatBounds;
  return { getBounds: () => bounds } as Pick<MapLibreMap, "getBounds">;
}

const atZoom = (zoom: number) => ({ getZoom: () => zoom }) as Pick<MapLibreMap, "getZoom">;

describe("clusterZoomOf", () => {
  it("rounds MapLibre's zoom, one less, to maplace's", () => {
    expect(clusterZoomOf(atZoom(2))).toBe(3);
    expect(clusterZoomOf(atZoom(2.4))).toBe(3);
    expect(clusterZoomOf(atZoom(2.6))).toBe(4);
  });
});

describe("clusterBoxOf", () => {
  it("pads the view by half its size each side", () => {
    expect(clusterBoxOf(showing(10, 20, 30, 60))).toEqual({
      south: 0,
      west: 0,
      north: 40,
      east: 80,
    });
  });

  it("keeps latitudes on the globe", () => {
    expect(clusterBoxOf(showing(-80, 0, 80, 10))).toMatchObject({ south: -90, north: 90 });
  });

  it("takes the whole world once the padded view spans it", () => {
    expect(clusterBoxOf(showing(-60, -100, 60, 140))).toEqual({
      south: -90,
      west: -180,
      north: 90,
      east: 180,
    });
  });
});

describe("isInBox", () => {
  it("finds a point in a view across the antimeridian given as unwrapped longitudes", () => {
    const box = { south: -10, west: 170, north: 10, east: 190 };
    expect(isInBox({ lat: 0, lng: -175 }, box)).toBe(true);
    expect(isInBox({ lat: 0, lng: 175 }, box)).toBe(true);
  });

  it("leaves out a point beyond the padded view", () => {
    const box = clusterBoxOf(showing(10, 20, 30, 60));
    expect(isInBox({ lat: 20, lng: 79 }, box)).toBe(true);
    expect(isInBox({ lat: 20, lng: 81 }, box)).toBe(false);
    expect(isInBox({ lat: 41, lng: 40 }, box)).toBe(false);
  });
});
