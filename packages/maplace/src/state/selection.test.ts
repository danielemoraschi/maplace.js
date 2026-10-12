import { describe, expect, it } from "vitest";
import type { Location } from "../location";
import type { Snapshot } from "../store";
import { NO_CHANGE } from "./change";
import { select } from "./selection";

const at = { lat: 0, lng: 0 };

function snapshotOf(locations: Location[], fields: Partial<Snapshot> = {}): Snapshot {
  return {
    locations: Object.freeze(locations),
    selectedId: undefined,
    hoveredId: undefined,
    filter: undefined,
    view: { kind: "fit-all", padding: 40 },
    viewport: undefined,
    route: undefined,
    routeResult: undefined,
    loadState: "idle",
    ...fields,
  };
}

const AB = snapshotOf([
  { id: "a", ...at },
  { id: "b", ...at, group: "N" },
]);

describe("select", () => {
  it("selects a location and pans to it", () => {
    expect(select(AB, "b")).toEqual({
      patch: { selectedId: "b", view: { kind: "location", id: "b", zoom: undefined } },
      events: [{ name: "select", payload: { id: "b" } }],
    });
  });

  it("zooms while panning when given a zoom", () => {
    expect(select(AB, "b", { zoom: 12 }).patch.view).toEqual({
      kind: "location",
      id: "b",
      zoom: 12,
    });
  });

  it("leaves the view alone with pan: false", () => {
    expect(select(AB, "b", { pan: false })).toEqual({
      patch: { selectedId: "b" },
      events: [{ name: "select", payload: { id: "b" } }],
    });
  });

  it("pans again to the selected location without a select event", () => {
    const selected = { ...AB, selectedId: "b" };
    const change = select(selected, "b");
    expect(change.events).toEqual([]);
    expect(change.patch.view).toEqual({ kind: "location", id: "b", zoom: undefined });
  });

  it("clears the selection with undefined, keeping the view", () => {
    expect(select({ ...AB, selectedId: "a" }, undefined)).toEqual({
      patch: { selectedId: undefined },
      events: [{ name: "select", payload: { id: undefined } }],
    });
  });

  it("changes nothing when clearing an empty selection", () => {
    expect(select(AB, undefined)).toBe(NO_CHANGE);
  });

  it("rejects an id that names no location", () => {
    expect(() => select(AB, "zz")).toThrow(
      expect.objectContaining({
        code: "unknown-id",
        message: 'select: id must name a location, got "zz"',
        locationId: "zz",
        field: "id",
      }),
    );
  });

  it("rejects a hidden location", () => {
    const hidden = snapshotOf([{ id: "a", ...at, visible: false }]);
    expect(() => select(hidden, "a")).toThrow(
      expect.objectContaining({
        code: "invalid-input",
        message:
          'select: id names a hidden location (visible: false, or outside the filter), got "a"',
        locationId: "a",
        field: "id",
      }),
    );
    expect(() => select({ ...AB, filter: ["N"] }, "a")).toThrow(/names a hidden location/);
  });

  it("rejects an empty id and bad options", () => {
    expect(() => select(AB, "")).toThrow(/^select: id must be a non-empty string, got ""$/);
    expect(() => select(AB, 5 as never)).toThrow(
      expect.objectContaining({
        locationId: undefined,
        message: "select: id must be a non-empty string, got 5",
      }),
    );
    expect(() => select(AB, "b", { pan: false, zoom: 3 } as never)).toThrow(
      /^select: options\.zoom needs pan/,
    );
    expect(() => select(AB, undefined, { pan: "no" } as never)).toThrow(
      /options\.pan must be a boolean/,
    );
  });
});
