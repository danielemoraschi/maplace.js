// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Maplace } from "../index";
import { createMaplace } from "../maplace/create";
import { createMapLibreAdapter } from "./create-adapter";

// maplibre-gl never loads: these tests read what attach and setRoute decide at once.
vi.mock("./library", () => ({ loadMapLibre: () => new Promise(() => {}) }));

const locations = [
  { id: "a", lat: 44.5, lng: 11.3 },
  { id: "b", lat: 44.8, lng: 11.6 },
];

let store: Maplace | undefined;

afterEach(() => {
  store?.destroy();
  store = undefined;
  document.body.replaceChildren();
});

function container(): HTMLElement {
  return document.body.appendChild(document.createElement("div"));
}

describe("the assembled MapLibre adapter", () => {
  it("declares circles, clustering and editing, and no routes: MapLibre has no routing", () => {
    const adapter = createMapLibreAdapter();
    expect([...adapter.capabilities].sort()).toEqual(["circle", "cluster", "edit"]);
    expect(adapter.routeStopLimit).toBeUndefined();
  });

  it("refuses a store's setRoute with unsupported-capability, leaving its route unset", () => {
    store = createMaplace({ locations });
    store.attach(createMapLibreAdapter(), container());
    expect(() => store?.setRoute({ stops: ["a", "b"] })).toThrow(
      expect.objectContaining({
        code: "unsupported-capability",
        field: "route",
        message: "setRoute: route needs the route capability, which this map's adapter lacks",
      }),
    );
    expect(store.getSnapshot().route).toBeUndefined();
  });

  it("refuses to attach a store that already has a route", () => {
    store = createMaplace({ locations });
    store.setRoute({ stops: ["a", "b"] });
    expect(() => store?.attach(createMapLibreAdapter(), container())).toThrow(
      "attach: route needs the route capability, which this map's adapter lacks",
    );
    expect(store.getSnapshot().loadState).toBe("idle");
  });
});
