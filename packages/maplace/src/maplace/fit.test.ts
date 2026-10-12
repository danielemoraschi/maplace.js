import { describe, expect, it } from "vitest";
import type { Location } from "../location";
import { initialSnapshot } from "../state/initial";
import type { Snapshot } from "../store";
import { createFakeAdapter } from "../testing/fake-adapter";
import type { View } from "../viewport";
import { createViewSender, resolveView } from "./fit";

const locations: Location[] = [
  { id: "a", lat: 10, lng: 10, group: "N" },
  { id: "b", lat: 20, lng: 20, group: "S" },
  { id: "c", lat: 30, lng: 30, visible: false },
];
const fitAll: View = { kind: "fit-all", padding: 24 };

describe("resolveView", () => {
  it("passes every view but fit-all through as it is", () => {
    const view: View = { kind: "center", center: { lat: 1, lng: 2 }, zoom: 5 };
    expect(resolveView(view, { locations, filter: undefined })).toBe(view);
  });

  it("turns fit-all into a box around the shown locations, with its padding", () => {
    expect(resolveView(fitAll, { locations, filter: undefined })).toEqual({
      kind: "fit-bounds",
      bounds: { south: 10, west: 10, north: 20, east: 20 },
      padding: 24,
    });
    expect(resolveView(fitAll, { locations, filter: ["S"] })).toMatchObject({
      bounds: { south: 20, west: 20, north: 20, east: 20 },
    });
  });

  it("resolves to nothing when no location is shown", () => {
    expect(resolveView(fitAll, { locations, filter: ["none"] })).toBeUndefined();
  });
});

describe("createViewSender", () => {
  it("sends a view when it changes", () => {
    const adapter = createFakeAdapter();
    const send = createViewSender(adapter);
    const first: Snapshot = initialSnapshot({ locations });
    send(first, undefined);
    send({ ...first, selectedId: "a" }, first);
    expect(adapter.callsOf("setView")).toHaveLength(1);
  });

  it("holds a fit-all with nothing shown until locations are shown", () => {
    const adapter = createFakeAdapter();
    const send = createViewSender(adapter);
    const empty: Snapshot = initialSnapshot(undefined);
    const filtered = { ...empty, locations, filter: ["none"] };
    const shown = { ...filtered, filter: undefined };
    send(empty, undefined);
    send(filtered, empty);
    expect(adapter.callsOf("setView")).toEqual([]);
    send(shown, filtered);
    send({ ...shown, locations: [...locations] }, shown);
    expect(adapter.callsOf("setView").map((call) => call.view)).toEqual([
      { kind: "fit-bounds", bounds: { south: 10, west: 10, north: 20, east: 20 }, padding: 40 },
    ]);
  });
});
