import type { AlgorithmInput } from "@googlemaps/markerclusterer";
import { describe, expect, it } from "vitest";
import type { Bounds } from "../viewport";
import { ClusteringAlgorithm } from "./clustering-algorithm";

/** A map at `zoom` showing `bounds`, as the algorithm reads one. */
function mapShowing(zoom: number, bounds: Bounds): google.maps.Map {
  return { getZoom: () => zoom, getBounds: () => ({ toJSON: () => bounds }) } as never;
}

/** The algorithm as a render drives it: its next view state, kept, and whether it changed. */
class RenderedClustering extends ClusteringAlgorithm {
  /** Whether a render on `map` clusters and draws again (the library's `deepEqual` of states). */
  clustersAgainOn(map: google.maps.Map): boolean {
    const next = this.getViewportState({ map } as AlgorithmInput);
    const changed = JSON.stringify(next) !== JSON.stringify(this.state);
    this.state = next;
    return changed;
  }
}

const VIEW: Bounds = { south: 10, west: 20, north: 14, east: 28 };

describe("ClusteringAlgorithm", () => {
  it("clusters nothing again for a pan inside what it clustered, at the same zoom", () => {
    const clustering = new RenderedClustering({});
    expect(clustering.clustersAgainOn(mapShowing(6, VIEW))).toBe(true);
    const panned = { ...VIEW, west: 22, east: 30 };
    expect(clustering.clustersAgainOn(mapShowing(6, panned))).toBe(false);
  });

  it("clusters again for a pan past what it clustered, or a new zoom", () => {
    const clustering = new RenderedClustering({});
    clustering.clustersAgainOn(mapShowing(6, VIEW));
    const farther = { ...VIEW, west: 40, east: 48 };
    expect(clustering.clustersAgainOn(mapShowing(6, farther))).toBe(true);
    expect(clustering.clustersAgainOn(mapShowing(7, farther))).toBe(true);
  });

  it("clusters the view once the map has one, after the whole world it clustered without", () => {
    const clustering = new RenderedClustering({});
    clustering.clustersAgainOn(mapShowing(10, { south: 0, west: 0, north: 0, east: 0 }));
    expect(clustering.clustersAgainOn(mapShowing(10, VIEW))).toBe(true);
  });

  it("clusters a map with no markers yet into no clusters", () => {
    const clustering = new ClusteringAlgorithm({});
    const input = { markers: [], map: mapShowing(6, VIEW) } as unknown as AlgorithmInput;
    expect(clustering.calculate(input).clusters).toEqual([]);
  });
});
