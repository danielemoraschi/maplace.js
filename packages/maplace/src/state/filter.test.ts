import { describe, expect, it } from "vitest";
import type { Snapshot } from "../store";
import { NO_CHANGE } from "./change";
import { setFilter } from "./filter";

const at = { lat: 0, lng: 0 };
const SNAPSHOT: Snapshot = {
  locations: Object.freeze([
    { id: "a", ...at, group: "N" },
    { id: "b", ...at, group: "S" },
  ]),
  selectedId: "b",
  hoveredId: undefined,
  filter: undefined,
  view: { kind: "fit-all", padding: 40 },
  viewport: undefined,
  route: undefined,
  routeResult: undefined,
  loadState: "idle",
};

describe("setFilter", () => {
  it("sets a frozen copy of the groups", () => {
    const groups = ["N", "S"];
    const filter = setFilter(SNAPSHOT, groups).patch.filter;
    expect(filter).toEqual(groups);
    expect(filter).not.toBe(groups);
    expect(Object.isFrozen(filter)).toBe(true);
  });

  it("deselects a selected location the filter hides", () => {
    expect(setFilter(SNAPSHOT, ["N"])).toEqual({
      patch: { filter: ["N"], selectedId: undefined },
      events: [{ name: "select", payload: { id: undefined } }],
    });
  });

  it("changes nothing for the same groups in the same order", () => {
    expect(setFilter({ ...SNAPSHOT, filter: ["N", "S"] }, ["N", "S"])).toBe(NO_CHANGE);
    expect(setFilter(SNAPSHOT, undefined)).toBe(NO_CHANGE);
  });

  it("shows every group again with undefined", () => {
    expect(setFilter({ ...SNAPSHOT, filter: ["N"] }, undefined).patch).toEqual({
      filter: undefined,
    });
  });

  it("rejects something that is not a list of groups", () => {
    expect(() => setFilter(SNAPSHOT, "N" as never)).toThrow(
      /^setFilter: groups must be an array of groups/,
    );
  });
});
