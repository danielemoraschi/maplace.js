import { describe, expect, it } from "vitest";
import type { Location } from "../location";
import { initialSnapshot } from "../state/initial";
import { locationView } from "../state/views";
import type { Snapshot } from "../store";
import { createFakeAdapter } from "../testing/fake-adapter";
import type { View } from "../viewport";
import { createViewSender, resolveView } from "./fit";

const locations: Location[] = [
  { id: "a", lat: 10, lng: 10, group: "N" },
  { id: "b", lat: 20, lng: 20, group: "S" },
  { id: "c", lat: 30, lng: 30, visible: false },
];
const shapes: Location[] = [
  {
    id: "park",
    type: "polygon",
    path: [
      { lat: 1, lng: 2 },
      { lat: 3, lng: 4 },
      { lat: 1, lng: 4 },
    ],
  },
  {
    id: "road",
    type: "polyline",
    path: [
      { lat: 5, lng: 6 },
      { lat: 7, lng: 8 },
    ],
  },
  { id: "ring", type: "circle", center: { lat: 0, lng: 0 }, radius: 1000 },
];
const fitAll: View = { kind: "fit-all", padding: 24 };

describe("resolveView", () => {
  it("passes a center view through as it is", () => {
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

  it("resolves a selected shape to a box around it, with the fit padding", () => {
    const scope = { locations: shapes, filter: undefined };
    const fitted = (id: string) => resolveView({ kind: "location", id, zoom: undefined }, scope);
    expect(fitted("park")).toEqual({
      kind: "fit-bounds",
      bounds: { south: 1, west: 2, north: 3, east: 4 },
      padding: 40,
    });
    expect(fitted("road")).toMatchObject({ bounds: { south: 5, west: 6, north: 7, east: 8 } });
    expect(fitted("ring")).toMatchObject({
      kind: "fit-bounds",
      bounds: { south: expect.closeTo(-0.009, 3), north: expect.closeTo(0.009, 3) },
    });
  });

  it("keeps a marker's view, and a shape's with a zoom, as they are", () => {
    const scope = { locations: [...locations, ...shapes], filter: undefined };
    const marker: View = { kind: "location", id: "a", zoom: undefined };
    const zoomed: View = { kind: "location", id: "park", zoom: 9 };
    expect(resolveView(marker, scope)).toBe(marker);
    expect(resolveView(zoomed, scope)).toBe(zoomed);
  });

  it("centres a location at its own zoom when the view has none", () => {
    const own: Location[] = [
      { id: "m", lat: 1, lng: 2, zoom: 9 },
      { ...(shapes[0] as Location), zoom: 11 },
    ];
    const scope = { locations: own, filter: undefined };
    const shown = (id: string) => resolveView({ kind: "location", id, zoom: undefined }, scope);
    expect(shown("m")).toEqual({ kind: "location", id: "m", zoom: 9 });
    expect(shown("park")).toEqual({ kind: "location", id: "park", zoom: 11 });
  });

  it("lets the view's zoom win over the location's", () => {
    const scope = { locations: [{ ...(shapes[0] as Location), zoom: 11 }], filter: undefined };
    const view: View = { kind: "location", id: "park", zoom: 4 };
    expect(resolveView(view, scope)).toBe(view);
  });
});

describe("createViewSender", () => {
  it("sends a view once, not again while it stays the same", () => {
    const adapter = createFakeAdapter();
    const send = createViewSender(adapter);
    const first: Snapshot = initialSnapshot({ locations });
    send(first, undefined);
    send({ ...first, selectedId: "a" }, first);
    expect(adapter.callsOf("setView")).toHaveLength(1);
  });

  it("opens on a selected marker with no zoom as on a fit of it, then pans to the next", () => {
    const adapter = createFakeAdapter();
    const send = createViewSender(adapter);
    const opening: Snapshot = {
      ...initialSnapshot({ locations }),
      view: locationView("a", undefined),
    };
    send(opening, undefined);
    send({ ...opening, view: locationView("b", undefined) }, opening);
    expect(adapter.callsOf("setView").map((call) => call.view)).toEqual([
      { kind: "fit-bounds", bounds: { south: 10, west: 10, north: 10, east: 10 }, padding: 40 },
      { kind: "location", id: "b", zoom: undefined },
    ]);
  });

  it("fits a selected marker whose locations arrive after the map opened, as its first view", () => {
    const adapter = createFakeAdapter();
    const send = createViewSender(adapter);
    const empty: Snapshot = initialSnapshot(undefined);
    const loaded: Snapshot = { ...empty, locations, view: locationView("a", undefined) };
    send(empty, undefined);
    send(loaded, empty);
    expect(adapter.callsOf("setView").map((call) => call.view)).toEqual([
      { kind: "fit-bounds", bounds: { south: 10, west: 10, north: 10, east: 10 }, padding: 40 },
    ]);
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
