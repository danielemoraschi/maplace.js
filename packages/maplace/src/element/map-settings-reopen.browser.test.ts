import { describe, expect, it } from "vitest";
import type { MaplaceMapElement } from "./index";
import { adaptersMade, lastAdapter, MILAN, mapFrom, nextTask, ROME } from "./testing/fake-maps";

const world = { south: -85, west: -180, north: 85, east: 180 };
const atWorld = { center: { lat: 0, lng: 0 }, zoom: 1, bounds: world };

/** An open map on the fake, its first adapter mounted. */
async function openMap(attributes = "") {
  const map = await mapFrom(`<maplace-map ${attributes}>${ROME}${MILAN}</maplace-map>`);
  const first = lastAdapter();
  await first.finishMount();
  return { map, first };
}

/** The map opened again for `scheme`: its new adapter, mounted. */
async function reopenedFor(map: MaplaceMapElement, scheme = "dark") {
  map.setAttribute("color-scheme", scheme);
  await nextTask();
  const adapter = lastAdapter();
  await adapter.finishMount();
  return adapter;
}

describe("<maplace-map> on a map setting changed", () => {
  it.each([
    ["color-scheme", "dark"],
    ["map-style", "https://tiles.example/style.json"],
    ["map-options", "{}"],
  ])(
    "opens the map again when %s changes, for a provider that names no settings, as a page's own",
    async (name, value) => {
      const { map, first } = await openMap();
      const store = map.maplace;
      map.setAttribute(name, value);
      await nextTask();
      expect(first.destroyed).toBe(true);
      expect(lastAdapter()).not.toBe(first);
      expect(map.maplace).toBe(store);
    },
  );

  it("keeps the store's locations and selection, and opens where the map was", async () => {
    const { map, first } = await openMap();
    const store = map.maplace;
    await first.probe().settle();
    store.select("milan");
    await first.probe().settle();
    const shown = store.getSnapshot().viewport;
    expect(shown).toBeDefined();
    const { locations } = store.getSnapshot();
    const reopened = await reopenedFor(map);
    expect(reopened).not.toBe(first);
    await expect
      .poll(() => reopened.callsOf("setView")[0]?.view)
      .toEqual({ kind: "center", center: shown?.center, zoom: shown?.zoom });
    expect(store.getSnapshot().selectedId).toBe("milan");
    expect(store.getSnapshot().locations).toBe(locations);
  });

  it("fits again, rather than keeping the view the map opened at before the fit landed", async () => {
    const { map, first } = await openMap();
    first.host().reportViewportChange(atWorld);
    const reopened = await reopenedFor(map);
    await expect.poll(() => reopened.callsOf("setView")[0]?.view.kind).toBe("fit-bounds");
  });

  it("keeps no camera a reopened map has only opened at, as on the first map", async () => {
    const { map, first } = await openMap();
    await first.probe().settle();
    map.maplace.select("milan");
    await first.probe().settle();
    const kept = map.maplace.getSnapshot().viewport;
    const reopened = await reopenedFor(map);
    reopened.host().reportViewportChange(atWorld);
    const third = await reopenedFor(map, "light");
    await expect
      .poll(() => third.callsOf("setView")[0]?.view)
      .toEqual({ kind: "center", center: kept?.center, zoom: kept?.zoom });
  });

  describe("on a fit, after the map opened at the world and the fit landed", () => {
    const panned = { center: { lat: 44, lng: 10 }, zoom: 7, bounds: world };

    async function fittedMap() {
      const { map, first } = await openMap();
      first.host().reportViewportChange(atWorld);
      await first.probe().settle();
      return { map, first };
    }

    it("fits again while the user hasn't moved the map, keeping the store's fit", async () => {
      const { map } = await fittedMap();
      const adapter = await reopenedFor(map);
      expect(map.maplace.getSnapshot().view.kind).toBe("fit-all");
      await expect.poll(() => adapter.callsOf("setView")[0]?.view.kind).toBe("fit-bounds");
    });

    it("keeps where the user moved it", async () => {
      const { map, first } = await fittedMap();
      first.host().reportViewportChange(panned);
      const adapter = await reopenedFor(map);
      expect(adapter.callsOf("setView")[0]?.view).toEqual({
        kind: "center",
        center: panned.center,
        zoom: panned.zoom,
      });
    });

    it("fits again when the user moved the map only while the fit waited for locations", async () => {
      const map = await mapFrom("<maplace-map></maplace-map>");
      const first = lastAdapter();
      await first.finishMount();
      first.host().reportViewportChange(atWorld);
      first.host().reportViewportChange(panned);
      map.maplace.setLocations([
        { id: "rome", lat: 41.9, lng: 12.5 },
        { id: "milan", lat: 45.46, lng: 9.19 },
      ]);
      await first.probe().settle();
      await reopenedFor(map);
      expect(map.maplace.getSnapshot().view.kind).toBe("fit-all");
    });
  });

  it("leaves a view not shown yet to the store, rather than where the map was", async () => {
    const { map, first } = await openMap();
    await first.probe().settle();
    map.maplace.setView({ lat: 10, lng: 10 }, 9);
    const reopened = await reopenedFor(map);
    expect(reopened.callsOf("setView").at(-1)?.view).toEqual({
      kind: "center",
      center: { lat: 10, lng: 10 },
      zoom: 9,
    });
  });

  it("still fits locations that come after the change", async () => {
    const map = await mapFrom("<maplace-map></maplace-map>");
    const first = lastAdapter();
    await first.finishMount();
    await first.probe().settle();
    const reopened = await reopenedFor(map);
    map.maplace.setLocations([
      { id: "rome", lat: 41.9, lng: 12.5 },
      { id: "milan", lat: 45.46, lng: 9.19 },
    ]);
    await nextTask();
    expect(reopened.callsOf("setView").map(({ view }) => view.kind)).toContain("fit-bounds");
  });

  it("does nothing for the same value", async () => {
    const { map, first } = await openMap('color-scheme="dark"');
    map.setAttribute("color-scheme", "dark");
    await nextTask();
    expect(lastAdapter()).toBe(first);
  });

  it("opens the map again once for both set together", async () => {
    const { map } = await openMap();
    const before = adaptersMade.length;
    map.setAttribute("color-scheme", "dark");
    map.setAttribute("map-options", "{}");
    await nextTask();
    expect(adaptersMade).toHaveLength(before + 1);
  });

  it("opens the map again only while it's open, and again after a reconnect", async () => {
    const before = adaptersMade.length;
    const map = await mapFrom(`<maplace-map hold>${ROME}</maplace-map>`);
    map.setAttribute("color-scheme", "dark");
    await nextTask();
    expect(adaptersMade).toHaveLength(before);
    map.release();
    expect(adaptersMade).toHaveLength(before + 1);
    map.remove();
    await nextTask();
    document.body.append(map);
    await nextTask();
    expect(adaptersMade).toHaveLength(before + 2);
    map.setAttribute("color-scheme", "light");
    await nextTask();
    expect(adaptersMade).toHaveLength(before + 3);
  });
});
