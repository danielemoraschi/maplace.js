// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { CLUSTER_RANK } from "../adapter-kit/stacking";
import type { ClusterGroup } from "./cluster-index";
import { createClusterMarkers } from "./cluster-markers";
import { markersOn, StubMapLibreMap } from "./testing/stub-maplibre";

const group = (id: number, count = 3): ClusterGroup => ({ id, at: { lat: id, lng: id }, count });

function clustersOnStub() {
  const map = new StubMapLibreMap();
  const press = vi.fn();
  const clusters = createClusterMarkers(map.asMapLibre(), press);
  return { map, press, clusters };
}

describe("the cluster markers", () => {
  it("labels a cluster with its count, a button reached with Tab, stacked at CLUSTER_RANK", () => {
    const { map, clusters } = clustersOnStub();
    clusters.show([group(1, 12)]);
    const [element] = markersOn(map);
    expect(element?.getAttribute("aria-label")).toBe("Cluster of 12 locations");
    expect(element?.getAttribute("role")).toBe("button");
    expect(element?.tabIndex).toBe(0);
    expect(element?.style.zIndex).toBe(String(CLUSTER_RANK));
    expect(element?.textContent).toBe("12");
  });

  it("zooms into the group it shows now when clicked, the click kept from the map", () => {
    const { map, press, clusters } = clustersOnStub();
    clusters.show([group(1, 3)]);
    clusters.show([group(1, 5)]);
    const heard = vi.fn();
    map.container.addEventListener("click", heard);
    markersOn(map)[0]?.click();
    expect(press).toHaveBeenCalledWith(group(1, 5), expect.any(MouseEvent));
    expect(heard).not.toHaveBeenCalled();
  });

  it("zooms in on Enter and on Space, and on no other key", () => {
    const { map, press, clusters } = clustersOnStub();
    clusters.show([group(1)]);
    const element = markersOn(map)[0] as HTMLElement;
    const pressing = ["Enter", " ", "a"].map((key) => {
      const event = new KeyboardEvent("keydown", { key, cancelable: true });
      element.dispatchEvent(event);
      return event.defaultPrevented;
    });
    expect(pressing).toEqual([true, true, false]);
    expect(press).toHaveBeenCalledTimes(2);
  });

  it("keeps a cluster's element while its id stays shown, and takes off those no longer shown", () => {
    const { map, clusters } = clustersOnStub();
    clusters.show([group(1), group(2)]);
    const [first] = markersOn(map);
    clusters.show([group(1, 4)]);
    expect(markersOn(map)).toEqual([first]);
    expect(first?.textContent).toBe("4");
    expect(first?.getAttribute("aria-label")).toBe("Cluster of 4 locations");
  });

  it("reuses a removed element for a new cluster", () => {
    const { map, clusters } = clustersOnStub();
    clusters.show([group(1)]);
    const [first] = markersOn(map);
    clusters.show([group(2, 7)]);
    expect(markersOn(map)).toEqual([first]);
    expect(first?.textContent).toBe("7");
  });

  it("takes every cluster off on release", () => {
    const { map, clusters } = clustersOnStub();
    clusters.show([group(1), group(2)]);
    clusters.release();
    expect(markersOn(map)).toEqual([]);
  });
});
