import { describe, expect, it } from "vitest";
import type { Location } from "../location";
import { initialSnapshot } from "../state/initial";
import type { Snapshot } from "../store";
import { createFakeAdapter } from "../testing/fake-adapter";
import { createAdapterSync } from "./sync";

const a: Location = { id: "a", lat: 0, lng: 0 };
const b: Location = { id: "b", lat: 1, lng: 1 };
const draw = {
  sanitize: undefined,
  style: undefined,
  selectedStyle: undefined,
  hoveredStyle: undefined,
  report: () => {},
};

function setup(locations: Location[] = [a, b]) {
  let snapshot: Snapshot = initialSnapshot({ locations });
  const adapter = createFakeAdapter();
  const sync = createAdapterSync({ adapter, getSnapshot: () => snapshot, draw });
  return {
    adapter,
    sync,
    change(patch: Partial<Snapshot>) {
      snapshot = Object.freeze({ ...snapshot, ...patch });
      sync.update();
    },
  };
}

describe("createAdapterSync", () => {
  it("sends nothing before start", () => {
    const { adapter, change } = setup();
    change({ selectedId: "a" });
    expect(adapter.calls).toEqual([]);
  });

  it("starts by sending every location, the presentation and the view, in that order", async () => {
    const { adapter, sync } = setup();
    await sync.start();
    expect(adapter.calls.map((call) => call.method)).toEqual(["apply", "present", "setView"]);
    expect(adapter.callsOf("apply")[0]?.diff.added.map((drawable) => drawable.id)).toEqual([
      "a",
      "b",
    ]);
    expect(adapter.callsOf("setView")[0]?.view).toMatchObject({ kind: "fit-bounds" });
  });

  it("applies once even with no locations, so the first load completes", async () => {
    const { adapter, sync } = setup([]);
    await sync.start();
    expect(adapter.callsOf("apply")).toEqual([
      { method: "apply", diff: { added: [], updated: [], removed: [] } },
    ]);
    expect(adapter.callsOf("setView")).toEqual([]);
  });

  it("then sends only what changed", async () => {
    const { adapter, sync, change } = setup();
    await sync.start();
    const sent = adapter.calls.length;
    change({ locations: [b], selectedId: "b" });
    change({ locations: [b] });
    change({ route: { stops: ["a", "b"] } });
    expect(adapter.calls.slice(sent)).toEqual([
      { method: "apply", diff: { added: [], updated: [], removed: ["a"] } },
      expect.objectContaining({ method: "present" }),
      { method: "setRoute", route: { stops: ["a", "b"] } },
    ]);
  });

  it("finishes a pass before one the adapter causes, keeping the store's order", async () => {
    const { adapter, sync, change } = setup();
    await sync.start();
    const present = adapter.present;
    adapter.present = (state) => {
      present(state);
      if (state.selectedId === "a") change({ route: { stops: ["a", "b"] } });
    };
    change({ selectedId: "a", view: { kind: "location", id: "a", zoom: undefined } });
    expect(adapter.calls.slice(-3).map((call) => call.method)).toEqual([
      "present",
      "setView",
      "setRoute",
    ]);
  });
});
