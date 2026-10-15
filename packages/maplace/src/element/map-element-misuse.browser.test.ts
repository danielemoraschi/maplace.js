import { describe, expect, it } from "vitest";
import {
  adaptersMade,
  errorsOn,
  lastAdapter,
  MILAN,
  mapFrom,
  nextTask,
  ROME,
} from "./testing/fake-maps";

describe("<maplace-map> misuse, never silent, standing until corrected", () => {
  it("keeps its locations through bad ones, in error until good ones come", async () => {
    const map = await mapFrom(`<maplace-map>${ROME}</maplace-map>`);
    const errors = errorsOn(map);
    map.locations = [{ id: "a", lat: "1" } as never];
    expect(errors.map(({ code }) => code)).toEqual(["invalid-input"]);
    expect([map.loadState, map.matches(":state(error)")]).toEqual(["error", true]);
    expect(map.locations.map(({ id }) => id)).toEqual(["rome"]);
    map.locations = [{ id: "a", lat: 1, lng: 2 }];
    expect(map.loadState).toBe("loading");
  });

  it("starts with bad children in error, with a store and no locations", async () => {
    const errors: unknown[] = [];
    document.addEventListener("maplace-error", (event) => errors.push(event), { once: true });
    const map = await mapFrom(
      '<maplace-map><maplace-location location-id="a" lat="x" lng="1"></maplace-location></maplace-map>',
    );
    expect([map.loadState, map.locations]).toEqual(["error", []]);
    expect(errors).toHaveLength(1);
    map.querySelector("maplace-location")?.setAttribute("lat", "1");
    await nextTask();
    expect(map.loadState).toBe("loading");
  });

  it("starts without the selection an unknown selected-id names, in error until one is made", async () => {
    const map = await mapFrom(`<maplace-map selected-id="milan">${ROME}</maplace-map>`);
    expect(map.maplace.getSnapshot()).toMatchObject({
      selectedId: undefined,
      locations: [{ id: "rome" }],
    });
    expect(map.loadState).toBe("error");
    map.maplace.select("rome");
    expect(map.loadState).toBe("loading");
  });

  it("opens no map for a provider that isn't registered, and opens one once it is named right", async () => {
    const before = adaptersMade.length;
    const map = document.createElement("maplace-map");
    map.setAttribute("provider", "google");
    const errors = errorsOn(map);
    document.body.replaceChildren(map);
    await nextTask();
    expect(errors.map(({ field }) => field)).toEqual(["provider"]);
    expect([adaptersMade.length, map.loadState]).toEqual([before, "error"]);
    map.setAttribute("class", "retried");
    await nextTask();
    expect(errors).toHaveLength(1);
    map.setAttribute("provider", "fake");
    await nextTask();
    expect(adaptersMade).toHaveLength(before + 1);
    expect(map.loadState).toBe("loading");
  });

  it("starts on its selected-id without a maplace-select, as an input's value is no change", async () => {
    const selected: unknown[] = [];
    document.addEventListener("maplace-select", (event) => selected.push(event));
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

  it("refuses a cluster attribute changed once the map is created, until put back", async () => {
    const map = await mapFrom(`<maplace-map>${ROME}</maplace-map>`);
    const errors = errorsOn(map);
    map.setAttribute("cluster", "");
    expect(errors.map(({ message }) => message)).toEqual([
      expect.stringMatching(/cluster can't change/),
    ]);
    map.removeAttribute("cluster");
    expect(map.loadState).toBe("loading");
    expect(lastAdapter().mounted?.cluster).toBe(false);
  });

  it("refuses a route the store refuses, keeping the one before", async () => {
    const map = await mapFrom(`<maplace-map>${ROME}</maplace-map>`);
    const errors = errorsOn(map);
    map.route = { stops: ["rome", "nowhere"] };
    expect(errors).toHaveLength(1);
    expect([map.route, map.loadState]).toEqual([undefined, "error"]);
    map.route = undefined;
    expect(map.loadState).toBe("loading");
  });
});
