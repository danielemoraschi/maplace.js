import { describe, expect, it, vi } from "vitest";
import { MAPLACE_EVENT_NAME_LIST } from "../events";
import { type Location, MaplaceError } from "../index";
import { eventPropName } from "./store-binding";
import { boundStore, TOWNS } from "./testing/bound-store";

describe("eventPropName", () => {
  it("names every event's prop on + the event", () => {
    expect(MAPLACE_EVENT_NAME_LIST.map(eventPropName)).toEqual([
      "onSelectionChange",
      "onHoverChange",
      "onLocationChange",
      "onPopupOpen",
      "onPopupClose",
      "onViewportChange",
      "onRouteChange",
      "onError",
    ]);
  });
});

describe("bindStore", () => {
  it("starts with the props' filter, route and selection, firing no event", async () => {
    const onSelectionChange = vi.fn();
    const onRouteChange = vi.fn();
    const { store } = await boundStore({
      locations: TOWNS,
      filter: ["N", "S"],
      route: { stops: ["north", "south"] },
      defaultSelectedId: "north",
      onSelectionChange,
      onRouteChange,
    });
    expect(store.getSnapshot()).toMatchObject({
      filter: ["N", "S"],
      route: { stops: ["north", "south"] },
      selectedId: "north",
    });
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(onRouteChange).not.toHaveBeenCalled();
  });

  it("passes each event to the prop of the latest render", async () => {
    const first = { onHoverChange: vi.fn(), onError: vi.fn() };
    const latest = { onHoverChange: vi.fn(), onError: vi.fn(), onLocationChange: vi.fn() };
    const locations = [{ id: "pin", lat: 45, lng: 9, editable: true }];
    const { host, render } = await boundStore({ locations, ...first });
    render({ locations, ...latest });
    host.reportHoverChange("pin");
    host.reportLocationChange("pin", { type: "marker", lat: 46, lng: 10 });
    const error = new MaplaceError("route-failed", "no route");
    host.reportError(error);
    expect(first.onHoverChange).not.toHaveBeenCalled();
    expect(latest.onHoverChange).toHaveBeenCalledWith({ id: "pin" });
    expect(latest.onLocationChange).toHaveBeenCalledWith(
      expect.objectContaining({ location: expect.objectContaining({ lat: 46 }) }),
    );
    expect(latest.onError).toHaveBeenCalledWith({ error });
  });

  it("makes the store with the other options, read once", async () => {
    const { adapter, render } = await boundStore({ locations: TOWNS, cluster: true });
    render({ locations: TOWNS, cluster: false });
    expect(adapter.mounted?.cluster).toBe(true);
    expect(adapter.destroyed).toBe(false);
  });

  it("gives the store its selected and hovered styles", async () => {
    const circle: Location = { id: "c", type: "circle", center: { lat: 0, lng: 0 }, radius: 5 };
    const { store, adapter } = await boundStore({
      locations: [circle],
      selectedStyle: { fill: "#ff0000" },
      hoveredStyle: { fill: "#00ff00" },
    });
    store.hover("c");
    expect(adapter.probe().location("c")?.style?.fill).toBe("#00ff00");
    store.select("c");
    expect(adapter.probe().location("c")?.style?.fill).toBe("#ff0000");
  });
});
