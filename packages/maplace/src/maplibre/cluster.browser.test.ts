import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { CLUSTER_RANK } from "../adapter-kit/stacking";
import { tabTo } from "../google/testing/page-input";
import {
  adding,
  LARGE_DIFF,
  manyMarkers,
  markerDrawable,
  presented,
  removing,
  TOWNS,
  townMarkers,
  updating,
} from "../testing/conformance/fixtures";
import { mountSubject, unmountAll } from "../testing/conformance/harness";
import type { MapProbe } from "../testing/map-probe";
import type { ResolvedView } from "../viewport";
import { wait } from "./testing/map-settle";
import { mountedMapLibre } from "./testing/mounted";
import { RENDER_WAIT, renderedIds } from "./testing/rendered";
import { maplibreParts, pageMapIn, removePageMaps } from "./testing/subject";

afterEach(() => {
  unmountAll();
  removePageMaps();
});

/**
 * Guards against gross regressions, not the RFC's figures, which are a dev machine's: the test
 * prints what it measured. Google's guard for clustering a large diff, and ten times the RFC's 50 ms
 * for a selection to reach its frame.
 */
const LONGEST_CLUSTERING_TASK_MS = 2_000;
const SELECTION_PAINTED_MS = 500;

/** The whole world, where `manyMarkers` are, at maplace's zoom 1. */
const WORLD: ResolvedView = { kind: "center", center: { lat: 0, lng: 0 }, zoom: 1 };

/** The towns, a few pixels apart, at a zoom that clusters them. */
const OVER_TOWNS: ResolvedView = { kind: "center", center: TOWNS.bologna, zoom: 3 };

/** The clusters on the page under `container`, by their elements, with their counts. */
function clustersOn(container: HTMLElement) {
  const elements = [...container.querySelectorAll<HTMLElement>("[aria-label^='Cluster of']")];
  const counts = elements.map((element) => Number(element.textContent));
  return { elements, counts };
}

/** How many of `ids` the map shows: in clusters, or alone. */
function shownTotal(container: HTMLElement, probe: MapProbe, ids: readonly string[]): number {
  const clustered = clustersOn(container).counts.reduce((sum, count) => sum + count, 0);
  const alone = ids.filter((id) => probe.location(id)?.visible).length;
  return clustered + alone;
}

/** The longest task the browser reports while `work` runs. */
async function longestTaskDuring(work: () => Promise<void>): Promise<number> {
  const tasks: number[] = [];
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) tasks.push(entry.duration);
  });
  observer.observe({ type: "longtask" });
  await work();
  // Long tasks are reported after they end, in a later task.
  await wait(50);
  observer.disconnect();
  return Math.round(Math.max(0, ...tasks));
}

/** A MapLibre map clustering the towns at zoom 3, settled. */
async function clusteredTowns() {
  const mounted = await mountedMapLibre(undefined, { cluster: true });
  mounted.adapter.setView(OVER_TOWNS);
  await mounted.adapter.apply(adding(...townMarkers()));
  await mounted.probe.settle();
  return mounted;
}

describe("clustering on MapLibre", () => {
  it("clusters a large diff into far fewer markers, within the accepted task", async () => {
    const { adapter, probe, container } = await mountedMapLibre(undefined, { cluster: true });
    adapter.setView(WORLD);
    await probe.settle();
    const markers = manyMarkers(LARGE_DIFF);
    const longest = await longestTaskDuring(() => adapter.apply(adding(...markers)));
    const ids = markers.map(({ id }) => id);
    const alone = ids.filter((id) => probe.location(id)?.visible).length;
    const { counts } = clustersOn(container);
    console.info(
      `clustering ${LARGE_DIFF} on MapLibre: ${counts.length} clusters and ${alone} pins, longest task ${longest} ms`,
    );
    expect(counts.length + alone).toBeLessThan(1000);
    expect(shownTotal(container, probe, ids)).toBe(LARGE_DIFF);
    expect(longest).toBeLessThanOrEqual(LONGEST_CLUSTERING_TASK_MS);
  });

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
    adapter.setView({ ...OVER_TOWNS, zoom: 17 });
    await probe.settle();
    expect(clustersOn(container).counts).toEqual([]);
    expect(icons.map(({ icon }) => icon.isConnected)).toEqual([true, true, true]);
  });

  it("draws a location selected from a list on its own, in front, and times the selection", async () => {
    const { adapter, probe, state, container } = await mountedMapLibre(undefined, {
      cluster: true,
    });
    adapter.setView(WORLD);
    await adapter.apply(adding(...manyMarkers(LARGE_DIFF)));
    await probe.settle();
    expect(probe.location("m100")?.visible).toBe(false);
    let selection = 0;
    const longest = await longestTaskDuring(async () => {
      const started = performance.now();
      adapter.present(presented({ selectedId: "m100" }));
      await new Promise(requestAnimationFrame);
      selection = Math.round(performance.now() - started);
    });
    console.info(
      `selecting one of ${LARGE_DIFF} clustered on MapLibre: ${selection} ms to the next frame, longest task ${longest} ms`,
    );
    expect(probe.location("m100")?.visible).toBe(true);
    const selected = state.placed.get("m100");
    expect(selected?.geometryType === "marker" && selected.isInDom()).toBe(true);
    expect(selected?.rank()).toBeGreaterThan(CLUSTER_RANK);
    expect(
      shownTotal(
        container,
        probe,
        manyMarkers(LARGE_DIFF).map(({ id }) => id),
      ),
    ).toBe(LARGE_DIFF);
    // The selection's own time, to its frame: a long task may be another test page's, on a busy run.
    expect(selection).toBeLessThanOrEqual(SELECTION_PAINTED_MS);
  });

  it("shows the pins a camera zoom-in leaves alone, and folds them again on zooming out, with no diff or presentation", async () => {
    const { adapter, probe, map } = await clusteredTowns();
    expect(probe.location("a")?.visible).toBe(false);
    adapter.setView({ ...OVER_TOWNS, zoom: 17 });
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
    adapter.setView({ ...OVER_TOWNS, zoom: 17 });
    await probe.settle();
    await vi.waitFor(async () => {
      await probe.settle();
      expect(renderedIds(map, ["maplace-pins"])).toEqual(["a"]);
    }, RENDER_WAIT);
    probe.pointerOver("a");
    adapter.setView(OVER_TOWNS);
    await probe.settle();
    adapter.setView({ ...OVER_TOWNS, zoom: 17 });
    await vi.waitFor(async () => {
      await probe.settle();
      expect(renderedIds(map, ["maplace-pins"])).toEqual(["a"]);
    }, RENDER_WAIT);
    probe.pointerOver("a");
    expect(host.reportsOf("reportHoverChange")).toEqual([["a"], [undefined], ["a"]]);
  });

  it("zooms into a cluster when it is clicked", async () => {
    const { map, probe, container } = await clusteredTowns();
    const zoom = map.getZoom();
    const [cluster] = clustersOn(container).elements;
    await userEvent.click(cluster as HTMLElement);
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
