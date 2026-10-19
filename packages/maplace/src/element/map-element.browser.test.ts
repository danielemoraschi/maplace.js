import { describe, expect, it } from "vitest";
import {
  adaptersMade,
  eventsOn,
  lastAdapter,
  MILAN,
  mapFrom,
  nextTask,
  ROME,
} from "./testing/fake-maps";

describe("<maplace-map> on a provider", () => {
  it("opens a map in its pane on connect, from its children", async () => {
    const map = await mapFrom(`<maplace-map>${ROME}</maplace-map>`);
    expect(map.maplace.getSnapshot().locations.map(({ id }) => id)).toEqual(["rome"]);
    expect(map.contains(lastAdapter().mounted?.container ?? null)).toBe(true);
  });

  it("shows its load state as a custom state: loading, then ready", async () => {
    const map = await mapFrom(`<maplace-map>${ROME}</maplace-map>`);
    const adapter = lastAdapter();
    expect([map.loadState, map.matches(":state(loading)")]).toEqual(["loading", true]);
    await adapter.finishMount();
    await map.maplace.whenReady();
    expect([map.loadState, map.matches(":state(ready)")]).toEqual(["ready", true]);
  });

  it("reads children added after it connected, as the parser streams them", async () => {
    const map = await mapFrom("<maplace-map></maplace-map>");
    map.insertAdjacentHTML("beforeend", ROME + MILAN);
    await nextTask();
    expect(map.locations.map(({ id }) => id)).toEqual(["rome", "milan"]);
    map.querySelector("maplace-location")?.remove();
    await nextTask();
    expect(map.locations.map(({ id }) => id)).toEqual(["milan"]);
  });

  it("draws a location's icon template as its marker, marked while selected", async () => {
    const map = await mapFrom(
      '<maplace-map><maplace-location location-id="milan" lat="45.46" lng="9.19"><template data-icon><span>★</span></template></maplace-location></maplace-map>',
    );
    const adapter = lastAdapter();
    await adapter.finishMount();
    const marker = () => adapter.probe().location("milan")?.icon as Element | undefined;
    await expect.poll(() => marker()?.outerHTML).toBe("<span>★</span>");
    map.maplace.select("milan");
    expect(marker()?.outerHTML).toBe('<span data-selected="">★</span>');
  });

  it("reads an inline JSON script", async () => {
    const map = await mapFrom(
      '<maplace-map><script type="application/json">[{"id":"a","lat":1,"lng":2}]</script></maplace-map>',
    );
    expect(map.locations).toEqual([{ id: "a", lat: 1, lng: 2 }]);
  });

  it("takes the locations property over its children once set", async () => {
    const map = await mapFrom(`<maplace-map>${ROME}</maplace-map>`);
    map.locations = [{ id: "a", lat: 1, lng: 2 }];
    map.insertAdjacentHTML("beforeend", MILAN);
    await nextTask();
    expect(map.locations.map(({ id }) => id)).toEqual(["a"]);
  });

  it("takes properties and attributes set before it connects, in any order", async () => {
    const map = document.createElement("maplace-map");
    map.locations = [
      { id: "a", lat: 1, lng: 2 },
      { id: "b", lat: 3, lng: 4 },
    ];
    map.route = { stops: ["a", "b"] };
    map.setAttribute("cluster", "");
    map.setAttribute("selected-id", "b");
    document.body.replaceChildren(map);
    await nextTask();
    expect(map.maplace.getSnapshot()).toMatchObject({
      selectedId: "b",
      route: { stops: ["a", "b"] },
    });
    expect(lastAdapter().mounted?.cluster).toBe(true);
  });

  it("takes properties set before it was defined", async () => {
    const inert = document.implementation.createHTMLDocument();
    const map = inert.createElement("maplace-map") as HTMLElement & { locations: unknown };
    map.locations = [{ id: "a", lat: 1, lng: 2 }];
    document.body.replaceChildren(document.adoptNode(map));
    await nextTask();
    expect(
      (map as unknown as HTMLElementTagNameMap["maplace-map"]).maplace.getSnapshot().locations,
    ).toEqual([{ id: "a", lat: 1, lng: 2 }]);
  });

  it("stays idle with hold, asking no provider and building no list, until released", async () => {
    const before = adaptersMade.length;
    const map = await mapFrom(`<maplace-map hold list>${ROME}</maplace-map>`);
    await nextTask();
    expect(adaptersMade).toHaveLength(before);
    expect([map.loadState, map.matches(":state(idle)")]).toEqual(["idle", true]);
    expect(map.querySelector('[role="listbox"]')).toBeNull();
    map.release();
    expect(adaptersMade).toHaveLength(before + 1);
    expect(map.loadState).toBe("loading");
    expect(map.querySelector('[role="listbox"]')?.textContent).toContain("Rome");
  });

  it("keeps its map and list when the page replaces its children", async () => {
    const map = await mapFrom(`<maplace-map list>${ROME}</maplace-map>`);
    const adapter = lastAdapter();
    map.innerHTML = MILAN;
    await nextTask();
    expect(map.locations.map(({ id }) => id)).toEqual(["milan"]);
    expect(map.contains(adapter.mounted?.container ?? null)).toBe(true);
    expect(map.querySelector('[role="listbox"]')?.textContent).toContain("Milan");
    expect(adapter.destroyed).toBe(false);
  });

  it("opens once connected when released before", async () => {
    const before = adaptersMade.length;
    const map = document.createElement("maplace-map");
    map.setAttribute("hold", "");
    expect(map.maplace.getSnapshot().loadState).toBe("idle");
    map.release();
    document.body.replaceChildren(map);
    await nextTask();
    expect(adaptersMade).toHaveLength(before + 1);
  });

  it("keeps its map through a move within one task", async () => {
    const map = await mapFrom(`<div id="a"></div><maplace-map>${ROME}</maplace-map>`);
    const adapter = lastAdapter();
    document.getElementById("a")?.append(map);
    await nextTask();
    expect(lastAdapter()).toBe(adapter);
    expect(adapter.destroyed).toBe(false);
  });

  it("closes its map when removed, keeping its store, and opens a new one when back", async () => {
    const map = await mapFrom(`<maplace-map>${ROME}</maplace-map>`);
    const [store, first] = [map.maplace, lastAdapter()];
    store.select("rome");
    map.remove();
    await nextTask();
    expect([first.destroyed, map.loadState]).toEqual([true, "idle"]);
    document.body.append(map);
    await nextTask();
    expect(lastAdapter()).not.toBe(first);
    expect(map.maplace).toBe(store);
    expect(store.getSnapshot().selectedId).toBe("rome");
  });

  it("opens the map again on a provider named later", async () => {
    const map = await mapFrom(`<maplace-map>${ROME}</maplace-map>`);
    const first = lastAdapter();
    map.setAttribute("provider", "fake");
    expect(first.destroyed).toBe(true);
    expect(lastAdapter()).not.toBe(first);
  });

  it("dispatches the store's events as bubbling maplace-* events", async () => {
    const map = await mapFrom(`<maplace-map>${ROME}</maplace-map>`);
    const selected = eventsOn(document, "maplace-selectionchange");
    map.maplace.select("rome");
    expect(selected.map(({ detail }) => detail)).toEqual([{ id: "rome" }]);
  });

  it("starts on its selected-id without a maplace-selectionchange, as an input's value is no change", async () => {
    const selected = eventsOn(document, "maplace-selectionchange");
    const map = await mapFrom(`<maplace-map selected-id="rome">${ROME}</maplace-map>`);
    expect(map.maplace.getSnapshot().selectedId).toBe("rome");
    expect(selected).toEqual([]);
  });

  it("takes a selected-id once the locations have it", async () => {
    const map = document.createElement("maplace-map");
    map.setAttribute("selected-id", "milan");
    expect(map.maplace.getSnapshot().selectedId).toBeUndefined();
    expect(map.loadState).toBe("error");
    map.innerHTML = ROME + MILAN;
    document.body.replaceChildren(map);
    await nextTask();
    expect(map.maplace.getSnapshot().selectedId).toBe("milan");
    expect(map.loadState).toBe("loading");
  });
});
