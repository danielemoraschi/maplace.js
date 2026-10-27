// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { CLUSTER_RANK } from "../adapter-kit/stacking";
import { createClusterMarker } from "./cluster-marker";
import { clusterOf } from "./testing/stub-clusters";
import { StubMap, type StubMarker, stubLibraries } from "./testing/stub-libraries";

function onStubMap() {
  const map = new StubMap(document.createElement("div"));
  return { map, googleMap: map as unknown as google.maps.Map };
}

describe("createClusterMarker", () => {
  it("draws a clickable, titled cluster above every location, zooming into it when clicked", () => {
    const { map, googleMap } = onStubMap();
    const bounds = { south: 1, west: 2, north: 3, east: 4 };
    const { element } = createClusterMarker(
      stubLibraries(),
      clusterOf(12, [2, 3], bounds),
      googleMap,
    );
    const shown = element as unknown as StubMarker;
    expect(shown).toMatchObject({ gmpClickable: true, zIndex: CLUSTER_RANK });
    expect(shown.title).toBe("Cluster of 12 locations");
    expect(shown.textContent).toBe("12");
    shown.dispatchEvent(new Event("gmp-click"));
    expect(map.fitBounds).toHaveBeenCalledWith(bounds);
  });

  it("zooms into the cluster it was last drawn for", () => {
    const { map, googleMap } = onStubMap();
    const first = { south: 1, west: 2, north: 3, east: 4 };
    const latest = { south: 1, west: 2, north: 3, east: 5 };
    const marker = createClusterMarker(stubLibraries(), clusterOf(12, [2, 3], first), googleMap);
    marker.cluster = clusterOf(12, [2, 3], latest);
    marker.element.dispatchEvent(new Event("gmp-click"));
    expect(map.fitBounds).toHaveBeenCalledWith(latest);
  });
});
