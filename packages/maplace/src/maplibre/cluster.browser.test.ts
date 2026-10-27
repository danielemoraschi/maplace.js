import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { CLUSTER_CLASS } from "../adapter-kit/cluster-badge";
import { tabTo } from "../google/testing/page-input";
import {
  adding,
  markerDrawable,
  presented,
  removing,
  townMarkers,
  updating,
} from "../testing/conformance/fixtures";
import { mountSubject, unmountAll } from "../testing/conformance/harness";
import { clustersOn } from "./testing/clusters";
import { mountedMapLibre } from "./testing/mounted";
import { RENDER_WAIT, renderedIds } from "./testing/rendered";
import { maplibreParts, pageMapIn, removePageMaps } from "./testing/subject";
import { clusteredTowns, ON_BOLOGNA, OVER_TOWNS } from "./testing/towns";

afterEach(() => {
  unmountAll();
  removePageMaps();
});

describe("clustering on MapLibre", () => {
  it("counts no hidden location in a cluster, nor a removed one", async () => {
    const { adapter, probe, container } = await clusteredTowns();
    adapter.present(presented({ hiddenIds: new Set(["a"]) }));
    expect(clustersOn(container).counts).toEqual([2]);
    await adapter.apply(removing("b"));
    expect(clustersOn(container).counts).toEqual([]);
    expect(probe.location("c")?.visible).toBe(true);
    expect(probe.location("a")?.visible).toBe(false);
  });

  it("clusters a moved location where it now is", async () => {
    const { adapter, probe, container } = await clusteredTowns();
    await adapter.apply(updating(markerDrawable("b", { lat: -33.9, lng: 18.4 })));
    expect(clustersOn(container).counts).toEqual([2]);
    expect(probe.location("b")).toMatchObject({
      visible: true,
      geometry: { type: "marker", lat: -33.9, lng: 18.4 },
    });
  });

  it("folds icon markers into clusters, their elements off the page, and shows each alone when zoomed in", async () => {
    const { adapter, probe, container } = await mountedMapLibre(undefined, { cluster: true });
    adapter.setView(OVER_TOWNS);
    const icons = townMarkers().map((town) => {
      const icon = document.createElement("span");
      return { icon, town: { ...town, renderIcon: () => icon } };
    });
    await adapter.apply(adding(...icons.map(({ town }) => town)));
    await probe.settle();
    expect(clustersOn(container).counts).toEqual([3]);
    expect(icons.map(({ icon }) => icon.isConnected)).toEqual([false, false, false]);
    adapter.setView(ON_BOLOGNA);
    await probe.settle();
    expect(clustersOn(container).counts).toEqual([]);
    expect(icons.map(({ icon }) => icon.isConnected)).toEqual([true, true, true]);
  });

  it("shows the pins a camera zoom-in leaves alone, and folds them again on zooming out, with no diff or presentation", async () => {
    const { adapter, probe, map } = await clusteredTowns();
    expect(probe.location("a")?.visible).toBe(false);
    adapter.setView(ON_BOLOGNA);
    await probe.settle();
    expect(probe.location("a")?.visible).toBe(true);
    await vi.waitFor(async () => {
      await probe.settle();
      expect(renderedIds(map, ["maplace-pins"])).toEqual(["a"]);
    }, RENDER_WAIT);
    adapter.setView(OVER_TOWNS);
    await probe.settle();
    expect(probe.location("a")?.visible).toBe(false);
    await vi.waitFor(async () => {
      await probe.settle();
      expect(renderedIds(map, ["maplace-pins"])).toEqual([]);
    }, RENDER_WAIT);
  });

  it("hovers a pin again when it unfolds under a pointer that never left it", async () => {
    const { adapter, probe, map, host } = await clusteredTowns();
    adapter.setView(ON_BOLOGNA);
    await probe.settle();
    await vi.waitFor(async () => {
      await probe.settle();
      expect(renderedIds(map, ["maplace-pins"])).toEqual(["a"]);
    }, RENDER_WAIT);
    probe.pointerOver("a");
    adapter.setView(OVER_TOWNS);
    await probe.settle();
    adapter.setView(ON_BOLOGNA);
    await vi.waitFor(async () => {
      await probe.settle();
      expect(renderedIds(map, ["maplace-pins"])).toEqual(["a"]);
    }, RENDER_WAIT);
    probe.pointerOver("a");
    expect(host.reportsOf("reportHoverChange")).toEqual([["a"], [undefined], ["a"]]);
  });

  it("draws a cluster as maplace's badge, in its default look", async () => {
    const { container } = await clusteredTowns();
    const [cluster] = clustersOn(container).elements as [HTMLElement];
    const badge = cluster.querySelector(`.${CLUSTER_CLASS}`);
    expect(badge && getComputedStyle(badge).backgroundColor).toBe("rgb(26, 115, 232)");
  });

  it("shows a pointer over a cluster, and zooms into it when it is clicked", async () => {
    const { map, probe, container } = await clusteredTowns();
    const zoom = map.getZoom();
    const [cluster] = clustersOn(container).elements as [HTMLElement];
    // As Google's clickable cluster shows it, not the hand MapLibre gives what pans the map.
    expect(getComputedStyle(cluster).cursor).toBe("pointer");
    await userEvent.click(cluster);
    await probe.settle();
    expect(map.getZoom()).toBeGreaterThan(zoom);
    expect(clustersOn(container).counts.every((count) => count < 3)).toBe(true);
  });

  it("is a button reached from the keyboard, zooming in on Enter, as the user's move", async () => {
    const { map, probe, container } = await clusteredTowns();
    const zoom = map.getZoom();
    const [cluster] = clustersOn(container).elements as [HTMLElement];
    expect(cluster.getAttribute("role")).toBe("button");
    await tabTo(cluster);
    await userEvent.keyboard("{Enter}");
    await probe.settle();
    const zoomedTo = map.getZoom();
    expect(zoomedTo).toBeGreaterThan(zoom);
    // A move of the store's would be shown again after a resize; the user's stays.
    container.style.width = "400px";
    await probe.settle();
    expect(map.getZoom()).toBe(zoomedTo);
  });

  it("shows only the clusters in and around the view, and those a pan brings in", async () => {
    const { adapter, probe, container } = await mountedMapLibre(undefined, { cluster: true });
    const capeTown = { lat: -33.9, lng: 18.4 };
    const farAway = [0, 1].map((step) =>
      markerDrawable(`far${step}`, { lat: capeTown.lat + step / 10, lng: capeTown.lng }),
    );
    adapter.setView({ ...OVER_TOWNS, zoom: 5 });
    await adapter.apply(adding(...townMarkers(), ...farAway));
    await probe.settle();
    expect(clustersOn(container).counts).toEqual([3]);
    adapter.setView({ kind: "center", center: capeTown, zoom: 5 });
    await probe.settle();
    expect(clustersOn(container).counts).toEqual([2]);
  });

  it("leaves the page's own map with none of maplace's clusters on destroy", async () => {
    const created: { map?: ReturnType<typeof pageMapIn> } = {};
    const subject = {
      name: "clustering on the page's map",
      create(container: HTMLElement) {
        created.map = pageMapIn(container);
        return maplibreParts({ map: created.map });
      },
    };
    const { adapter, probe, container, destroy } = await mountSubject(subject, { cluster: true });
    adapter.setView(OVER_TOWNS);
    await adapter.apply(adding(...townMarkers()));
    await probe.settle();
    expect(clustersOn(container).counts).toEqual([3]);
    destroy();
    expect(clustersOn(container).elements).toEqual([]);
    expect(created.map?.getContainer().isConnected).toBe(true);
  });
});
