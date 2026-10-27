// @vitest-environment happy-dom
import type { Cluster } from "@googlemaps/markerclusterer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type ClusterMarkers, createClusterMarkers } from "./cluster-markers";
import { clusterOf } from "./testing/stub-clusters";
import { StubMap, stubLibraries } from "./testing/stub-libraries";

type Marker = google.maps.marker.AdvancedMarkerElement;

const map = new StubMap(document.createElement("div")) as unknown as google.maps.Map;

/** One render of `clusters`, each marker put on the map as the clusterer puts it, then its end. */
function render(markers: ClusterMarkers, ...clusters: Cluster[]): Marker[] {
  const drawn = clusters.map((cluster) => markers.render(cluster, {} as never, map) as Marker);
  for (const marker of drawn) marker.map = map;
  markers.endRender();
  return drawn;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["requestAnimationFrame"] });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("createClusterMarkers", () => {
  it("draws the same marker for a cluster at the same place with as many locations", () => {
    const markers = createClusterMarkers(stubLibraries());
    const [first] = render(markers, clusterOf(12, [2, 3]));
    expect(render(markers, clusterOf(12, [2, 3]))[0]).toBe(first);
  });

  it("draws a new marker for a cluster of other locations, or at another place", () => {
    const markers = createClusterMarkers(stubLibraries());
    const [first] = render(markers, clusterOf(12, [2, 3]));
    const [moreLocations] = render(markers, clusterOf(13, [2, 3]));
    expect(moreLocations).not.toBe(first);
    expect(render(markers, clusterOf(13, [2, 4]))[0]).not.toBe(moreLocations);
  });

  it("zooms a kept marker into the cluster it was last drawn for", () => {
    const markers = createClusterMarkers(stubLibraries());
    const latest = { south: 1, west: 2, north: 3, east: 5 };
    render(markers, clusterOf(12, [2, 3], { south: 1, west: 2, north: 3, east: 4 }));
    const [kept] = render(markers, clusterOf(12, [2, 3], latest));
    kept?.dispatchEvent(new Event("gmp-click"));
    expect(map.fitBounds).toHaveBeenLastCalledWith(latest);
  });

  it("takes off the map, a frame after a render, the markers that render didn't draw", () => {
    const markers = createClusterMarkers(stubLibraries());
    const [staying, leaving] = render(markers, clusterOf(12, [2, 3]), clusterOf(4, [5, 6]));
    render(markers, clusterOf(12, [2, 3]));
    expect(leaving?.map).toBe(map);
    vi.advanceTimersToNextFrame();
    expect([staying?.map, leaving?.map]).toEqual([map, null]);
  });

  it("keeps a marker of its own for each of two clusters alike in one render", () => {
    const markers = createClusterMarkers(stubLibraries());
    const [one, other] = render(markers, clusterOf(2, [2, 3]), clusterOf(2, [2, 3]));
    expect(one).not.toBe(other);
    const [oneAgain, otherAgain] = render(markers, clusterOf(2, [2, 3]), clusterOf(2, [2, 3]));
    expect([oneAgain === one, otherAgain === other]).toEqual([true, true]);
  });

  it("takes every marker off on release", () => {
    const markers = createClusterMarkers(stubLibraries());
    const drawn = render(markers, clusterOf(12, [2, 3]), clusterOf(4, [5, 6]));
    markers.release();
    expect(drawn.map((marker) => marker.map)).toEqual([null, null]);
  });
});
