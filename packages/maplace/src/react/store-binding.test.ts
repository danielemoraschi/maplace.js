import { describe, expect, it, vi } from "vitest";
import { MAPLACE_EVENT_NAME_LIST } from "../events";
import { MaplaceError } from "../index";
import { eventPropName } from "./store-binding";
import { boundStore, TOWNS } from "./testing/bound-store";

describe("eventPropName", () => {
  it("names every event's prop on + the event", () => {
    expect(MAPLACE_EVENT_NAME_LIST.map(eventPropName)).toEqual([
      "onSelect",
      "onHover",
      "onChange",
      "onPopupOpen",
      "onPopupClose",
      "onViewport",
      "onRoute",
      "onError",
    ]);
  });
});

describe("bindStore", () => {
  it("starts with the props' filter, route and selection, firing no event", async () => {
    const onSelect = vi.fn();
    const onRoute = vi.fn();
    const { store } = await boundStore({
      locations: TOWNS,
      filter: ["N", "S"],
      route: { stops: ["north", "south"] },
      defaultSelectedId: "north",
      onSelect,
      onRoute,
    });
    expect(store.getSnapshot()).toMatchObject({
      filter: ["N", "S"],
      route: { stops: ["north", "south"] },
      selectedId: "north",
    });
    expect(onSelect).not.toHaveBeenCalled();
    expect(onRoute).not.toHaveBeenCalled();
  });

  it("passes each event to the prop of the latest render", async () => {
    const first = { onHover: vi.fn(), onError: vi.fn() };
    const latest = { onHover: vi.fn(), onError: vi.fn(), onChange: vi.fn() };
    const locations = [{ id: "pin", lat: 45, lng: 9, editable: true }];
    const { host, render } = await boundStore({ locations, ...first });
    render({ locations, ...latest });
    host.reportHover("pin");
    host.reportChange("pin", { type: "marker", lat: 46, lng: 10 });
    const error = new MaplaceError("route-failed", "no route");
    host.reportError(error);
    expect(first.onHover).not.toHaveBeenCalled();
    expect(latest.onHover).toHaveBeenCalledWith({ id: "pin" });
    expect(latest.onChange).toHaveBeenCalledWith(
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
});
