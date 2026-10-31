import { describe, expect, it, vi } from "vitest";
import type { Location } from "../location";
import { createMaplace } from "../maplace/create";
import { createPropFollower, initialSelectedId } from "./controlled-props";
import { boundStore } from "./testing/bound-store";
import { TOWNS } from "./testing/towns";

const NORTH = { locations: TOWNS, selectedId: "north" };
const TAGGED: readonly Location[] = [
  { id: "garage", lat: 46, lng: 11, tags: ["parking"] },
  { id: "bar", lat: 40, lng: 16, tags: ["late"] },
];

describe("a controlled selectedId", () => {
  it("takes a selection the parent passes back, panning once", async () => {
    const onSelectionChange = vi.fn();
    const { store, adapter, host, renders, render } = await boundStore({
      ...NORTH,
      onSelectionChange,
    });
    host.reportSelectionChange("south");
    const pans = adapter.callsOf("setView").length;
    render({ ...NORTH, selectedId: "south", onSelectionChange });
    expect(onSelectionChange.mock.calls).toEqual([[{ id: "south" }]]);
    expect(renders()).toBe(1);
    expect(store.getSnapshot().selectedId).toBe("south");
    expect(adapter.callsOf("setView")).toHaveLength(pans);
  });

  it("goes back to the prop, panning back, when the parent keeps it", async () => {
    const onSelectionChange = vi.fn();
    const { store, adapter, host, render } = await boundStore({ ...NORTH, onSelectionChange });
    host.reportSelectionChange("south");
    const pans = adapter.callsOf("setView").length;
    render({ ...NORTH, onSelectionChange });
    expect(store.getSnapshot().selectedId).toBe("north");
    expect(adapter.callsOf("setView")).toHaveLength(pans + 1);
    expect(onSelectionChange.mock.calls).toEqual([[{ id: "south" }]]);
  });

  it("holds the app's own select() to the prop too", async () => {
    const onSelectionChange = vi.fn();
    const { store, render } = await boundStore({ ...NORTH, onSelectionChange });
    store.select("east");
    render({ ...NORTH, onSelectionChange });
    expect(onSelectionChange.mock.calls).toEqual([[{ id: "east" }]]);
    expect(store.getSnapshot().selectedId).toBe("north");
  });

  it("selects a new prop without reporting it", async () => {
    const onSelectionChange = vi.fn();
    const { store, renders, render } = await boundStore({ ...NORTH, onSelectionChange });
    render({ ...NORTH, selectedId: "east", onSelectionChange });
    render({ ...NORTH, selectedId: undefined, onSelectionChange });
    expect(store.getSnapshot().selectedId).toBeUndefined();
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(renders()).toBe(0);
  });

  it("never pans again for the prop it already shows", async () => {
    const { adapter, render } = await boundStore(NORTH);
    const calls = adapter.calls.length;
    render({ ...NORTH });
    render({ ...NORTH });
    expect(adapter.calls).toHaveLength(calls);
  });

  it("selects an id that comes with new locations, without reporting the old one cleared", async () => {
    const onSelectionChange = vi.fn();
    const { store, render } = await boundStore({ ...NORTH, onSelectionChange });
    const west: Location = { id: "west", lat: 44, lng: 8 };
    render({ locations: [west], selectedId: "west", onSelectionChange });
    expect(store.getSnapshot().selectedId).toBe("west");
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it("waits for an id not loaded yet, or hidden, and selects it once shown", async () => {
    const { store, render } = await boundStore({
      locations: [],
      selectedId: "north",
      filter: ["S"],
    });
    expect(store.getSnapshot().selectedId).toBeUndefined();
    render({ locations: TOWNS, selectedId: "north", filter: ["S"] });
    expect(store.getSnapshot().selectedId).toBeUndefined();
    render({ locations: TOWNS, selectedId: "north", filter: ["N"] });
    expect(store.getSnapshot().selectedId).toBe("north");
  });

  it("starts with nothing selected when the first filter hides the prop's id", async () => {
    const { store, render } = await boundStore({
      locations: TOWNS,
      filter: ["S"],
      selectedId: "north",
    });
    expect(store.getSnapshot().selectedId).toBeUndefined();
    render({ locations: TOWNS, filter: ["N"], selectedId: "north" });
    expect(store.getSnapshot().selectedId).toBe("north");
  });

  it("selects an id a query hid at the next render, not when the query clears", async () => {
    const { store, render } = await boundStore(NORTH);
    store.setFilter({ query: "south" });
    expect(store.getSnapshot().selectedId).toBeUndefined();
    store.setFilter(undefined);
    expect(store.getSnapshot().selectedId).toBeUndefined();
    render(NORTH);
    expect(store.getSnapshot().selectedId).toBe("north");
  });

  it("can't become uncontrolled", async () => {
    const { render } = await boundStore(NORTH);
    expect(() => render({ locations: TOWNS })).toThrow(
      expect.objectContaining({ code: "invalid-input", field: "selectedId" }),
    );
  });

  it("can't come with defaultSelectedId", async () => {
    await expect(boundStore({ ...NORTH, defaultSelectedId: "south" })).rejects.toMatchObject({
      code: "invalid-input",
      field: "defaultSelectedId",
    });
  });
});

describe("defaultSelectedId", () => {
  it("starts the selection, then leaves it to the user", async () => {
    const onSelectionChange = vi.fn();
    const props = { locations: TOWNS, defaultSelectedId: "north", onSelectionChange };
    const { store, host, renders, render } = await boundStore(props);
    expect(store.getSnapshot().selectedId).toBe("north");
    host.reportSelectionChange("south");
    render(props);
    expect(store.getSnapshot().selectedId).toBe("south");
    expect(onSelectionChange.mock.calls).toEqual([[{ id: "south" }]]);
    expect(renders()).toBe(0);
  });

  it("waits for its location, and selects it once loaded", async () => {
    const { store, render } = await boundStore({ locations: [], defaultSelectedId: "north" });
    render({ locations: TOWNS, defaultSelectedId: "north" });
    expect(store.getSnapshot().selectedId).toBe("north");
  });

  it("stops waiting once something else is selected first", async () => {
    const { store, host, render } = await boundStore({
      locations: TOWNS.slice(1),
      defaultSelectedId: "north",
    });
    host.reportSelectionChange("south");
    render({ locations: TOWNS, defaultSelectedId: "north" });
    expect(store.getSnapshot().selectedId).toBe("south");
  });
});

describe("locations, filter and route props", () => {
  it("apply locations when the array changes, so an edit outlives a render", async () => {
    const locations: Location[] = [{ id: "pin", lat: 45, lng: 9, editable: true }];
    const { store, adapter, host, render } = await boundStore({ locations });
    host.reportLocationChange("pin", { type: "marker", lat: 46, lng: 10 });
    render({ locations });
    expect(store.getSnapshot().locations[0]).toMatchObject({ lat: 46, lng: 10 });
    const applies = adapter.callsOf("apply").length;
    render({ locations: [...store.getSnapshot().locations] });
    expect(adapter.callsOf("apply")).toHaveLength(applies);
    render({ locations: TOWNS });
    expect(adapter.callsOf("apply")).toHaveLength(applies + 1);
  });

  it("apply a filter and route when their value changes, an equal one costing nothing", async () => {
    const props = (filter: string[]) => ({
      locations: TOWNS,
      filter,
      route: { stops: ["north", "south"], travelMode: "driving" as const },
    });
    const { store, adapter, render } = await boundStore(props(["N", "S"]));
    const calls = adapter.calls.length;
    render(props(["N", "S"]));
    expect(adapter.calls).toHaveLength(calls);
    render(props(["N"]));
    expect(store.getSnapshot().filter).toEqual({ groups: ["N"] });
    expect(adapter.callsOf("setRoute")).toHaveLength(1);
  });

  it("apply a filter of tags by its value, a fresh object of the same one costing nothing", async () => {
    const props = (tags: string[]) => ({ locations: TAGGED, filter: { tags } });
    const { store, adapter, render } = await boundStore(props(["parking"]));
    const calls = adapter.calls.length;
    render(props(["parking"]));
    expect(adapter.calls).toHaveLength(calls);
    render(props(["late"]));
    expect(store.getSnapshot().filter).toEqual({ tags: ["late"] });
  });

  it("keep a query typed in the box through a render, and replace it when the prop changes", async () => {
    const { store, render } = await boundStore({ locations: TOWNS, filter: { tags: ["a"] } });
    store.setFilter({ tags: ["a"], query: "north" });
    render({ locations: TOWNS, filter: { tags: ["a"] } });
    expect(store.getSnapshot().filter?.query).toBe("north");
    render({ locations: TOWNS, filter: { tags: ["b"] } });
    expect(store.getSnapshot().filter).toEqual({ tags: ["b"] });
  });

  it("apply a query by its value, a fresh object of the same one costing nothing", async () => {
    const { store, render } = await boundStore({ locations: TOWNS, filter: { query: "north" } });
    const before = store.getSnapshot().filter;
    render({ locations: TOWNS, filter: { query: "north" } });
    expect(store.getSnapshot().filter).toBe(before);
  });

  it("start with a selection the first filter of tags shows, and without one it hides", () => {
    const props = (tag: string) => ({
      locations: TAGGED,
      filter: { tags: [tag] },
      defaultSelectedId: "garage",
    });
    expect(initialSelectedId(props("parking"))).toBe("garage");
    expect(initialSelectedId(props("late"))).toBeUndefined();
  });

  it.each([
    ["an unknown key", { tag: ["parking"] }],
    ["null", null],
  ])("throw on %s as a filter, before and after the first render", (_, filter) => {
    const bad = { locations: TAGGED, filter: filter as never };
    const message = /^<MaplaceProvider>: filter/;
    expect(() => initialSelectedId(bad)).toThrow(message);
    const follower = createPropFollower(createMaplace(), { locations: TAGGED }, () => {});
    expect(() => follower.follow(bad)).toThrow(message);
  });

  it("apply a route whose stops passed through alone change", async () => {
    const stops = ["north", "south", "east"];
    const props = (via?: string[]) => ({ locations: TOWNS, route: { stops, via } });
    const { store, adapter, render } = await boundStore(props());
    render(props(["south"]));
    expect(store.getSnapshot().route?.via).toEqual(["south"]);
    expect(adapter.callsOf("setRoute")).toHaveLength(2);
    render(props(["south"]));
    expect(adapter.callsOf("setRoute")).toHaveLength(2);
  });

  it("leave app code's own filter and route until the props change", async () => {
    const props = (stops: string[]) => ({ locations: TOWNS, filter: ["N", "S"], route: { stops } });
    const { store, adapter, render } = await boundStore(props(["north", "south"]));
    store.setFilter(["S"]);
    store.setRoute({ stops: ["south", "east"] });
    render(props(["north", "south"]));
    expect(store.getSnapshot()).toMatchObject({
      filter: { groups: ["S"] },
      route: { stops: ["south", "east"] },
    });
    render(props(["east", "north"]));
    expect(store.getSnapshot().route?.stops).toEqual(["east", "north"]);
    expect(adapter.callsOf("setRoute")).toHaveLength(3);
  });
});
