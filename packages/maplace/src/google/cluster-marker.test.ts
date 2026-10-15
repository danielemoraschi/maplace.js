// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { CLUSTER_RANK } from "../adapter-kit/stacking";
import { clusterRenderer } from "./cluster-marker";
import { StubMap, type StubMarker, stubLibraries } from "./testing/stub-libraries";

describe("clusterRenderer", () => {
  it("draws a clickable, titled cluster above every location, zooming into it when clicked", () => {
    const map = new StubMap(document.createElement("div"));
    const bounds = { south: 1, west: 2, north: 3, east: 4 };
    const cluster = { position: { lat: 2, lng: 3 }, count: 12, bounds };
    const shown = clusterRenderer(stubLibraries()).render(
      cluster as never,
      {} as never,
      map as unknown as google.maps.Map,
    ) as unknown as StubMarker;
    expect(shown).toMatchObject({ gmpClickable: true, zIndex: CLUSTER_RANK });
    expect(shown.title).toBe("Cluster of 12 locations");
    expect(shown.textContent).toBe("12");
    shown.dispatchEvent(new Event("gmp-click"));
    expect(map.fitBounds).toHaveBeenCalledWith(bounds);
  });
});
