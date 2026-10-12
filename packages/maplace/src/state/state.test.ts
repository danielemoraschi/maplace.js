import { describe, expect, it, vi } from "vitest";
import type { Location } from "../location";
import { patchOnly } from "./change";
import { createInternalState, createState } from "./state";

const at = { lat: 0, lng: 0 };
const locations: Location[] = [
  { id: "a", ...at, group: "N" },
  { id: "b", ...at, group: "S" },
];

describe("createState", () => {
  it("returns the same snapshot until something changes", () => {
    const state = createState({ locations });
    const first = state.getSnapshot();
    expect(state.getSnapshot()).toBe(first);
    state.select("a");
    expect(state.getSnapshot()).not.toBe(first);
    expect(state.getSnapshot().locations).toBe(first.locations);
  });

  it("notifies subscribers once per change, and not for calls that change nothing", () => {
    const state = createState({ locations });
    const onChange = vi.fn();
    state.subscribe(onChange);
    state.setFilter(["N", "S"]);
    state.setFilter(["N", "S"]);
    state.select(undefined);
    state.setLocations([...locations]);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("notifies subscribers, then emits events, with the new snapshot already in place", () => {
    const state = createState({ locations });
    const order: string[] = [];
    state.subscribe(() => order.push(`change:${state.getSnapshot().selectedId}`));
    state.on("select", ({ id }) => order.push(`select:${id}:${state.getSnapshot().selectedId}`));
    state.select("a");
    expect(order).toEqual(["change:a", "select:a:a"]);
  });

  it("emits the events of a cascade: a filter hiding the selection deselects", () => {
    const state = createState({ locations, selectedId: "b" });
    const onSelect = vi.fn();
    state.on("select", onSelect);
    state.setFilter(["N"]);
    expect(onSelect).toHaveBeenCalledWith({ id: undefined });
    expect(state.getSnapshot().selectedId).toBeUndefined();
  });

  it("lets a listener call the store, which commits before returning", () => {
    const state = createState({ locations });
    const seen: (string | undefined)[] = [];
    state.on("select", ({ id }) => {
      seen.push(id);
      if (id === "a") state.select("b");
    });
    state.select("a");
    expect(seen).toEqual(["a", "b"]);
    expect(state.getSnapshot().selectedId).toBe("b");
  });

  it("delivers a nested call's notification and events after the outer call's, in order", () => {
    const state = createState({ locations });
    const order: string[] = [];
    state.subscribe(() => order.push(`change:${state.getSnapshot().selectedId}`));
    state.on("select", ({ id }) => {
      if (id === "a") state.select("b");
    });
    state.on("select", ({ id }) => order.push(`select:${id}`));
    state.select("a");
    expect(order).toEqual(["change:a", "select:a", "change:b", "select:b"]);
  });

  it("keeps the view the store holds frozen, coordinates included", () => {
    const state = createState({ locations });
    state.setView({ lat: 1, lng: 1 }, 3);
    const view = state.getSnapshot().view;
    expect(Object.isFrozen(view)).toBe(true);
    expect(view.kind === "center" && Object.isFrozen(view.center)).toBe(true);
  });

  it("changes nothing and notifies no one when a call throws", () => {
    const state = createState({ locations });
    const onChange = vi.fn();
    state.subscribe(onChange);
    const before = state.getSnapshot();
    expect(() => state.select("zz")).toThrow(expect.objectContaining({ code: "unknown-id" }));
    expect(state.getSnapshot()).toBe(before);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("checks html against its own sanitize option", () => {
    const html: Location = { id: "h", ...at, html: "<b>x</b>" };
    expect(() => createState().setLocations([html])).toThrow(
      expect.objectContaining({ code: "missing-sanitizer" }),
    );
    const state = createState({ sanitize: (text) => text });
    state.setLocations([html]);
    expect(state.getSnapshot().locations).toEqual([html]);
  });

  it("wires every view and route method", () => {
    const state = createState({ locations });
    state.fitBounds({ south: 0, west: 0, north: 1, east: 1 });
    expect(state.getSnapshot().view.kind).toBe("fit-bounds");
    state.setView({ lat: 1, lng: 1 }, 3);
    expect(state.getSnapshot().view.kind).toBe("center");
    state.fitAll();
    expect(state.getSnapshot().view.kind).toBe("fit-all");
    state.setRoute({ stops: ["a", "b"] });
    expect(state.getSnapshot().route?.stops).toEqual(["a", "b"]);
  });

  it("keeps instances apart", () => {
    const first = createState({ locations });
    const second = createState({ locations });
    first.select("a");
    expect(second.getSnapshot().selectedId).toBeUndefined();
  });

  it("rejects a subscriber that is not a function", () => {
    expect(() => createState().subscribe("log" as never)).toThrow(
      /^subscribe: onChange must be a function, got "log"$/,
    );
  });
});

describe("after destroy", () => {
  it("throws `destroyed` from every call that changes state or adds a listener", () => {
    const state = createState({ locations });
    state.destroy();
    const calls: [string, () => unknown][] = [
      ["setLocations", () => state.setLocations([])],
      ["select", () => state.select("a")],
      ["setFilter", () => state.setFilter(undefined)],
      ["fitAll", () => state.fitAll()],
      ["fitBounds", () => state.fitBounds({ south: 0, west: 0, north: 1, east: 1 })],
      ["setView", () => state.setView({ lat: 0, lng: 0 }, 1)],
      ["setRoute", () => state.setRoute(undefined)],
      ["on", () => state.on("select", () => {})],
      ["subscribe", () => state.subscribe(() => {})],
    ];
    for (const [method, call] of calls) {
      expect(call).toThrow(
        expect.objectContaining({
          code: "destroyed",
          message: `${method}: this maplace was destroyed`,
        }),
      );
    }
  });

  it("keeps getSnapshot, a second destroy and unsubscribe functions safe", () => {
    const state = createState({ locations });
    const unsubscribe = state.subscribe(() => {});
    const off = state.on("select", () => {});
    const last = state.getSnapshot();
    state.destroy();
    expect(() => {
      state.destroy();
      unsubscribe();
      off();
    }).not.toThrow();
    expect(state.getSnapshot()).toBe(last);
  });

  it("drops every listener and stops watching their signals", () => {
    const state = createState({ locations });
    const signal = new AbortController().signal;
    const remove = vi.spyOn(signal, "removeEventListener");
    state.on("select", () => {}, { signal });
    state.destroy();
    expect(remove).toHaveBeenCalledTimes(1);
  });
});

describe("createInternalState", () => {
  it("commits the store's own changes without validation, even after destroy", () => {
    const { store, commitOwn } = createInternalState({ locations });
    const onChange = vi.fn();
    store.subscribe(onChange);
    commitOwn(patchOnly({ loadState: "loading" }));
    expect(store.getSnapshot().loadState).toBe("loading");
    expect(onChange).toHaveBeenCalledTimes(1);
    store.destroy();
    commitOwn(patchOnly({ loadState: "idle" }));
    expect(store.getSnapshot().loadState).toBe("idle");
  });

  it("names the method a destroyed store was called with", () => {
    const { store, checkNotDestroyed } = createInternalState();
    store.destroy();
    expect(() => checkNotDestroyed("whenReady")).toThrow(
      expect.objectContaining({
        code: "destroyed",
        message: "whenReady: this maplace was destroyed",
      }),
    );
  });
});
