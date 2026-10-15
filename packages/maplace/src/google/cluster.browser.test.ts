/// <reference types="google.maps" />
import { expect, it } from "vitest";
import { commands, userEvent } from "vitest/browser";
import type { MarkerGeometry } from "../geometry";
import type { Location } from "../location";
import { createMaplace } from "../maplace/create";
import { LARGE_DIFF, manyMarkers } from "../testing/conformance/fixtures";
import { sizedContainer } from "../testing/container";
import type { View } from "../viewport";
import { frames } from "./frames";
import { idle } from "./testing/map-waits";
import { centreOf, tabTo } from "./testing/page-input";
import { onGoogle } from "./testing/store-on-google";
import { pageMapIn } from "./testing/subject";
import { describeWithMaps } from "./testing/with-maps";

/** The task Chromium may take clustering a large diff at once (RFC Performance: 210 ms accepted). */
const LONGEST_CLUSTERING_TASK_MS = 400;

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

/** The markers Google shows on `map`: clusters with their counts, and locations drawn alone. */
function shownOn(map: google.maps.Map) {
  const elements = [...map.getDiv().querySelectorAll<HTMLElement>("gmp-advanced-marker")];
  const counts = elements.map((element) => /^Cluster of (\d+)/.exec(element.title)?.[1]);
  const clustered = counts.filter((count) => count !== undefined).map(Number);
  return { elements, clustered, alone: counts.length - clustered.length };
}

/** Every location on the map: those clusters count, and those drawn alone. */
function total(clustered: readonly number[], alone: number): number {
  return clustered.reduce((sum, count) => sum + count, 0) + alone;
}

/** A store on Google clustering `locations`, once its map has settled and rendered clusters. */
async function clusteredOnGoogle(locations: Location[], view?: View) {
  const attached = await onGoogle(createMaplace({ locations, cluster: true, view }));
  const map = attached.googleMap() as google.maps.Map;
  await idle(map);
  // The clusterer takes old cluster markers off a frame after each render.
  await frames(3);
  return { ...attached, map };
}

/** The longest tasks the browser reports while `work` runs. */
async function longestTaskDuring(work: () => Promise<void>): Promise<number> {
  const tasks: number[] = [];
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) tasks.push(entry.duration);
  });
  observer.observe({ type: "longtask" });
  await work();
  observer.disconnect();
  return Math.round(Math.max(0, ...tasks));
}

describeWithMaps("clustering on Google", () => {
  it("clusters a large diff into far fewer markers, within the accepted task", async () => {
    let map: google.maps.Map | undefined;
    const longest = await longestTaskDuring(async () => {
      ({ map } = await clusteredOnGoogle(points(LARGE_DIFF)));
    });
    const { elements, clustered, alone } = shownOn(map as google.maps.Map);
    console.info(
      `clustering ${LARGE_DIFF}: ${elements.length} markers, longest task ${longest} ms`,
    );
    expect(elements.length).toBeLessThan(1000);
    expect(total(clustered, alone)).toBe(LARGE_DIFF);
    expect(longest).toBeLessThanOrEqual(LONGEST_CLUSTERING_TASK_MS);
  });

  it("counts no hidden location in a cluster, nor a removed one", async () => {
    const { maplace, map } = await clusteredOnGoogle(points(400, (index) => index % 2 === 0));
    let shown = shownOn(map);
    expect(total(shown.clustered, shown.alone)).toBe(200);
    maplace.setLocations(points(300, (index) => index % 2 === 0));
    await expect
      .poll(() => {
        shown = shownOn(map);
        return total(shown.clustered, shown.alone);
      })
      .toBe(150);
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
    const before = shownOn(map).elements.filter((element) => element.title === "m100");
    maplace.select("m100");
    await expect.poll(() => opened).toEqual(["m100"]);
    expect(before).toEqual([]);
    expect(shownOn(map).elements.filter((element) => element.title === "m100")).toHaveLength(1);
  });

  it("zooms into a cluster when it is clicked", async () => {
    const { map } = await clusteredOnGoogle(points(400));
    const zoom = map.getZoom() as number;
    const cluster = shownOn(map).elements.find((element) => element.title.startsWith("Cluster"));
    await commands.pressMouse([centreOf(cluster as HTMLElement)]);
    await expect.poll(() => map.getZoom()).toBeGreaterThan(zoom);
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
    await idle(map);
    expect(shownOn(map).clustered.length).toBeGreaterThan(0);
    adapter.destroy();
    // The clusterer takes cluster markers off a frame after it lets go.
    await expect.poll(() => shownOn(map).elements).toEqual([]);
  });
});
