import type { LngLatBounds, Map as MapLibreMap } from "maplibre-gl";
import { describe, expect, it } from "vitest";
import { clusterBoxOf, clusterZoomOf } from "./cluster-view";

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
  it("pads the map's view by half its size each side", () => {
    expect(clusterBoxOf(showing(10, 20, 30, 60))).toEqual({
      south: 0,
      west: 0,
      north: 40,
      east: 80,
    });
  });
});
