// @vitest-environment happy-dom
import type { AlgorithmInput } from "@googlemaps/markerclusterer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Bounds } from "../viewport";
import { ClusteringAlgorithm } from "./clustering-algorithm";
import { StubMarker } from "./testing/stub-libraries";

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

/** Google's `LatLng`, as the library builds one from a marker's position; a cluster's isn't read. */
class FakeLatLng {
  constructor(
    private readonly latitude: number,
    private readonly longitude: number,
  ) {}
  lat = () => this.latitude;
  lng = () => this.longitude;
}

const markerAt = (lat: number, lng: number) => new StubMarker({ position: { lat, lng } });

/** The size of each cluster a render on `VIEW` at zoom 6 draws, and whether it draws again. */
function clustered(clustering: ClusteringAlgorithm, markers: StubMarker[]) {
  const input = { markers, map: mapShowing(6, VIEW) } as unknown as AlgorithmInput;
  const { clusters, changed } = clustering.calculate(input);
  return { sizes: clusters.map((cluster) => cluster.markers?.length), changed };
}

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
    expect(clustered(new ClusteringAlgorithm({}), []).sizes).toEqual([]);
  });

  describe("once a marker moved", () => {
    beforeEach(() =>
      vi.stubGlobal("google", {
        maps: { LatLng: FakeLatLng, marker: { AdvancedMarkerElement: StubMarker } },
      }),
    );
    afterEach(() => vi.unstubAllGlobals());

    it("clusters a list emptied in the same change into no clusters, and draws again", () => {
      const clustering = new ClusteringAlgorithm({});
      expect(clustered(clustering, [markerAt(12, 24), markerAt(12.1, 24.1)]).sizes).toEqual([2]);
      clustering.forgetPositions();
      expect(clustered(clustering, [])).toEqual({ sizes: [], changed: true });
    });

    it("clusters the same list where its markers now are", () => {
      const clustering = new ClusteringAlgorithm({});
      const moved = markerAt(12.1, 24.1);
      const markers = [markerAt(12, 24), moved];
      clustered(clustering, markers);
      moved.position = { lat: 13.5, lng: 27 };
      clustering.forgetPositions();
      expect(clustered(clustering, markers)).toEqual({ sizes: [1, 1], changed: true });
    });
  });
});
