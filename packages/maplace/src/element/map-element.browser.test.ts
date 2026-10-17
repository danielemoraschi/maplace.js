import { describe, expect, it } from "vitest";
import { adaptersMade, lastAdapter, MILAN, mapFrom, nextTask, ROME } from "./testing/fake-maps";

describe("<maplace-map> on a provider", () => {
  it("opens a map in its pane on connect, from its children, and shows the load state", async () => {
    const map = await mapFrom(`<maplace-map>${ROME}</maplace-map>`);
    const adapter = lastAdapter();
    expect(map.maplace.getSnapshot().locations.map(({ id }) => id)).toEqual(["rome"]);
    expect(map.contains(adapter.mounted?.container ?? null)).toBe(true);
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

  it("stays idle with hold, asking no provider, until released", async () => {
    const before = adaptersMade.length;
    const map = await mapFrom(`<maplace-map hold list>${ROME}</maplace-map>`);
    await nextTask();
    expect(adaptersMade).toHaveLength(before);
    expect([map.loadState, map.matches(":state(idle)")]).toEqual(["idle", true]);
    expect(map.querySelector('[role="listbox"]')?.textContent).toContain("Rome");
    map.release();
    expect(adaptersMade).toHaveLength(before + 1);
    expect(map.loadState).toBe("loading");
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
    const selected: unknown[] = [];
    document.addEventListener("maplace-selectionchange", (event) =>
      selected.push((event as CustomEvent).detail),
    );
    map.maplace.select("rome");
    expect(selected).toEqual([{ id: "rome" }]);
  });
});
