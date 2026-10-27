/// <reference types="google.maps" />
import { expect, it } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { CLUSTER_CLASS } from "../adapter-kit/cluster-badge";
import type { MarkerGeometry } from "../geometry";
import type { Location } from "../location";
import { createMaplace } from "../maplace/create";
import { LARGE_DIFF, manyMarkers } from "../testing/conformance/fixtures";
import { sizedContainer } from "../testing/container";
import { longestTaskDuring } from "../testing/long-tasks";
import type { View } from "../viewport";
import { frames } from "./frames";
import { centreOf, steadyPoint, tabTo } from "./testing/page-input";
import { onGoogle, TILES_TIMEOUT_MS } from "./testing/store-on-google";
import { pageMapIn } from "./testing/subject";
import { describeWithMaps } from "./testing/with-maps";

/**
 * A guard against gross regressions (one render per marker would take minutes), not the RFC's
 * figure, which is a dev machine's: clustering 4,000 took 81 ms there and 643 ms on a GitHub
 * runner. The test prints what it measured.
 */
const LONGEST_CLUSTERING_TASK_MS = 2_000;

/** `count` titled locations spread over the world, as the "big" example's points are. */
function points(count: number, hidden: (index: number) => boolean = () => false): Location[] {
  return manyMarkers(count).map(({ id, geometry }, index) => ({
    id,
    title: id,
    ...(geometry as MarkerGeometry),
    visible: !hidden(index),
    content: () => document.createTextNode(id),
  }));
}

/**
 * The markers Google shows on `map`: clusters with their counts, the locations drawn alone, and
 * the `total` of locations those show.
 */
function shownOn(map: google.maps.Map) {
  const elements = [...map.getDiv().querySelectorAll<HTMLElement>("gmp-advanced-marker")];
  const counts = elements.map(clusterSize);
  const clustered = counts.filter((count) => count !== undefined);
  const alone = counts.length - clustered.length;
  const total = clustered.reduce((sum, count) => sum + count, 0) + alone;
  return { elements, clustered, alone, total };
}

/** The whole world, where `points` are, twice across the map: more than one world shows. */
const WORLD: View = { kind: "center", center: { lat: 0, lng: 0 }, zoom: 0 };

/** The world's middle, a quarter of a turn wide on the 512 px map: what it clusters is held. */
const ZOOM_3: View = { kind: "center", center: { lat: 0, lng: 0 }, zoom: 3 };

/** Zoomed in on location `m100`, past where `points` cluster. */
const CLOSE_TO_M100: View = { kind: "center", center: { lat: 15, lng: -80 }, zoom: 10 };

/**
 * A store on Google clustering `locations`, once every shown location is on the map, in a
 * cluster or alone. Not Google's next `idle`: on a slow runner the map is idle before a test
 * listens, and nothing moves it again.
 */
async function clusteredOnGoogle(locations: Location[], view?: View) {
  const attached = await onGoogle(createMaplace({ locations, cluster: true, view }));
  const map = attached.googleMap() as google.maps.Map;
  await allShownOn(map, locations.filter((location) => location.visible !== false).length);
  return { ...attached, map };
}

/** Once `count` locations show on `map`, in clusters or alone. */
async function allShownOn(map: google.maps.Map, count: number): Promise<void> {
  await expect.poll(() => shownOn(map).total, { timeout: TILES_TIMEOUT_MS }).toBe(count);
  // Cluster markers a render no longer draws come off a frame after it.
  await frames(3);
}

/** The cluster markers on `map`. */
function clustersOn(map: google.maps.Map): HTMLElement[] {
  return shownOn(map).elements.filter((element) => clusterSize(element) !== undefined);
}

/** The cluster of the fewest locations: the tightest bounds, so a click on it zooms in. */
function smallestCluster(map: google.maps.Map): HTMLElement | undefined {
  const sizeOf = (element: HTMLElement) => clusterSize(element) ?? 0;
  return clustersOn(map).sort((a, b) => sizeOf(a) - sizeOf(b))[0];
}

/** Of `elements`, the one nearest the point `right` px right of `map`'s centre. */
function nearestRightOfCentre(map: google.maps.Map, elements: HTMLElement[], right: number) {
  const centre = centreOf(map.getDiv());
  const distances = elements.map((element) => {
    const { x, y } = centreOf(element);
    return { element, distance: Math.hypot(x - centre.x - right, y - centre.y) };
  });
  return distances.sort((a, b) => a.distance - b.distance)[0]?.element as HTMLElement;
}

/** The locations a cluster marker stands for; undefined for a location drawn alone. */
function clusterSize(element: HTMLElement): number | undefined {
  const count = /^Cluster of (\d+)/.exec(element.title)?.[1];
  return count === undefined ? undefined : Number(count);
}

/** The markers drawing location `id` on its own. */
function drawnAlone(map: google.maps.Map, id: string): HTMLElement[] {
  return shownOn(map).elements.filter((element) => element.title === id);
}

describeWithMaps("clustering on Google", () => {
  it("clusters a large diff into far fewer markers, within the accepted task", async () => {
    // Timed alone, on a map that has drawn its tiles: a runner's load is no part of clustering.
    const container = sizedContainer();
    const map = pageMapIn(container);
    const tilesLoaded = new Promise<void>((resolve) => {
      google.maps.event.addListenerOnce(map, "tilesloaded", () => resolve());
    });
    const store = createMaplace({ cluster: true, view: WORLD });
    const { maplace } = await onGoogle(store, { map, container });
    await tilesLoaded;
    const longest = await longestTaskDuring(async () => {
      maplace.setLocations(points(LARGE_DIFF));
      await allShownOn(map, LARGE_DIFF);
    });
    const { elements, total } = shownOn(map);
    console.info(
      `clustering ${LARGE_DIFF}: ${elements.length} markers, longest task ${longest} ms`,
    );
    expect(elements.length).toBeLessThan(1000);
    expect(total).toBe(LARGE_DIFF);
    // maplace's sheet reaches the badge inside Google's advanced marker.
    const badge = map.getDiv().querySelector(`.${CLUSTER_CLASS}`);
    expect(badge && getComputedStyle(badge).backgroundColor).toBe("rgb(26, 115, 232)");
    expect(longest).toBeLessThanOrEqual(LONGEST_CLUSTERING_TASK_MS);
  });

  it("puts only the markers in and near the view on the map, zoomed past clustering", async () => {
    const store = createMaplace({
      locations: points(LARGE_DIFF),
      cluster: true,
      view: CLOSE_TO_M100,
    });
    const map = (await onGoogle(store)).googleMap() as google.maps.Map;
    await expect.poll(() => drawnAlone(map, "m100"), { timeout: TILES_TIMEOUT_MS }).toHaveLength(1);
    await frames(3);
    expect(shownOn(map).elements.length).toBeLessThan(50);
  });

  it("keeps a cluster's marker, and its focus, over a pan past what it clustered", async () => {
    const store = createMaplace({ locations: points(LARGE_DIFF), cluster: true, view: ZOOM_3 });
    const map = (await onGoogle(store)).googleMap() as google.maps.Map;
    await expect
      .poll(() => shownOn(map).clustered.length, { timeout: TILES_TIMEOUT_MS })
      .toBeGreaterThan(0);
    await frames(3);
    const before = new Set(clustersOn(map));
    // Past the east of what was clustered, the cluster focused right of the centre still in view:
    // Google moves the focus off a marker that leaves the view.
    const width = map.getDiv().clientWidth;
    const focused = nearestRightOfCentre(map, [...before], width * 0.3);
    // Not by Tab: hundreds of markers may come before it.
    focused.focus();
    expect(document.activeElement).toBe(focused);
    map.panBy(width * 0.6, 0);
    await expect
      .poll(() => clustersOn(map).some((element) => !before.has(element)), {
        timeout: TILES_TIMEOUT_MS,
      })
      .toBe(true);
    await frames(3);
    expect(clustersOn(map)).toContain(focused);
    expect(document.activeElement).toBe(focused);
  });

  it("counts no hidden location in a cluster, nor a removed one", async () => {
    const { maplace, map } = await clusteredOnGoogle(points(400, (index) => index % 2 === 0));
    expect(shownOn(map).total).toBe(200);
    maplace.setLocations(points(300, (index) => index % 2 === 0));
    await expect.poll(() => shownOn(map).total).toBe(150);
  });

  it("clusters a moved location where it now is", async () => {
    const together = [
      { id: "a", lat: 44.49, lng: 11.34 },
      { id: "b", lat: 44.5, lng: 11.35 },
    ];
    const view: View = { kind: "center", center: { lat: 44.5, lng: 11.35 }, zoom: 5 };
    const { maplace, map } = await clusteredOnGoogle(together, view);
    expect(shownOn(map).clustered).toEqual([2]);
    maplace.setLocations([together[0] as Location, { id: "b", lat: -33.9, lng: 18.4 }]);
    await expect.poll(() => shownOn(map).clustered).toEqual([]);
  });

  it("draws a location selected from a list on its own, with its popup", async () => {
    const { maplace, map } = await clusteredOnGoogle(points(400));
    const opened: string[] = [];
    maplace.on("popupOpen", ({ id }) => opened.push(id));
    expect(drawnAlone(map, "m100")).toEqual([]);
    maplace.select("m100");
    await expect.poll(() => opened).toEqual(["m100"]);
    // Google shows the marker once it re-clusters after the pan, which may follow the popup.
    await expect.poll(() => drawnAlone(map, "m100")).toHaveLength(1);
  });

  it("zooms into a cluster when it is clicked", async () => {
    const { map } = await clusteredOnGoogle(points(400));
    const zoom = map.getZoom() as number;
    await commands.pressMouse([await steadyPoint(() => smallestCluster(map))]);
    await expect.poll(() => map.getZoom(), { timeout: TILES_TIMEOUT_MS }).toBeGreaterThan(zoom);
  });

  it("is a button reached from the keyboard, zooming in on Enter", async () => {
    const { map } = await clusteredOnGoogle(points(400));
    const zoom = map.getZoom() as number;
    const cluster = shownOn(map).elements.find((element) => element.title.startsWith("Cluster"));
    expect(cluster?.getAttribute("role")).toBe("button");
    await tabTo(cluster as HTMLElement);
    await userEvent.keyboard("{Enter}");
    await expect.poll(() => map.getZoom()).toBeGreaterThan(zoom);
  });

  it("leaves the page's own map as it was on destroy, with none of maplace's clusters", async () => {
    const container = sizedContainer();
    const map = pageMapIn(container);
    const store = createMaplace({ locations: points(400), cluster: true });
    const { adapter } = await onGoogle(store, { map, container });
    await expect
      .poll(() => shownOn(map).clustered.length, { timeout: TILES_TIMEOUT_MS })
      .toBeGreaterThan(0);
    adapter.destroy();
    // Google takes the markers out of the page once maplace takes them off the map.
    await expect.poll(() => shownOn(map).elements).toEqual([]);
  });
});
