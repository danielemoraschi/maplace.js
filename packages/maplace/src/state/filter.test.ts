import { describe, expect, it } from "vitest";
import { isShown } from "../location-state";
import type { Snapshot } from "../store";
import { NO_CHANGE } from "./change";
import { setFilter } from "./filter";

const at = { lat: 0, lng: 0 };
const SNAPSHOT: Snapshot = {
  locations: Object.freeze([
    { id: "a", ...at, group: "N", tags: ["parking", "late"] },
    { id: "b", ...at, group: "S", tags: ["parking"] },
    { id: "c", ...at, group: "N" },
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

/** The ids shown under what `setFilter` keeps for `request`. */
function shownUnder(request: Parameters<typeof setFilter>[1]): string[] {
  const filter = setFilter(SNAPSHOT, request).patch.filter;
  return SNAPSHOT.locations.filter((location) => isShown(location, filter)).map(({ id }) => id);
}

describe("setFilter", () => {
  it("takes a list as groups", () => {
    expect(setFilter(SNAPSHOT, ["N", "S"]).patch.filter).toEqual({ groups: ["N", "S"] });
  });

  it("keeps a frozen copy of the filter and of its lists", () => {
    const groups = ["N", "S"];
    const tags = ["parking"];
    const filter = setFilter(SNAPSHOT, { groups, tags }).patch.filter;
    expect(filter?.groups).not.toBe(groups);
    expect(filter?.tags).not.toBe(tags);
    expect(Object.isFrozen(filter)).toBe(true);
    expect(Object.isFrozen(filter?.groups)).toBe(true);
    expect(Object.isFrozen(filter?.tags)).toBe(true);
  });

  it("shows what is in any of the groups", () => {
    expect(shownUnder(["S"])).toEqual(["b"]);
    expect(shownUnder({ groups: ["N", "S"] })).toEqual(["a", "b", "c"]);
  });

  it("shows what has all of the tags", () => {
    expect(shownUnder({ tags: ["parking"] })).toEqual(["a", "b"]);
    expect(shownUnder({ tags: ["parking", "late"] })).toEqual(["a"]);
  });

  it("shows what matches both the groups and the tags", () => {
    expect(shownUnder({ groups: ["S"], tags: ["parking"] })).toEqual(["b"]);
    expect(shownUnder({ groups: ["S"], tags: ["late"] })).toEqual([]);
  });

  it("hides a location without tags while a tag is asked for", () => {
    expect(shownUnder({ tags: ["parking"] })).not.toContain("c");
  });

  it("asks for nothing with no tags, leaving no filter", () => {
    expect(setFilter(SNAPSHOT, { tags: [] })).toBe(NO_CHANGE);
    expect(setFilter(SNAPSHOT, {})).toBe(NO_CHANGE);
    expect(setFilter({ ...SNAPSHOT, filter: { tags: ["late"] } }, { tags: [] }).patch).toEqual({
      filter: undefined,
    });
  });

  it("hides everything with an empty list of groups", () => {
    expect(shownUnder([])).toEqual([]);
    expect(shownUnder({ groups: [] })).toEqual([]);
  });

  it("deselects a selected location the filter hides", () => {
    expect(setFilter(SNAPSHOT, ["N"])).toEqual({
      patch: { filter: { groups: ["N"] }, selectedId: undefined },
      events: [{ name: "selectionChange", payload: { id: undefined } }],
    });
    expect(setFilter(SNAPSHOT, { tags: ["late"] }).patch.selectedId).toBeUndefined();
  });

  it("changes nothing for the same filter, in either form", () => {
    const filtered = { ...SNAPSHOT, filter: { groups: ["N", "S"] } };
    expect(setFilter(filtered, ["N", "S"])).toBe(NO_CHANGE);
    expect(setFilter(filtered, { groups: ["N", "S"] })).toBe(NO_CHANGE);
    expect(setFilter(SNAPSHOT, undefined)).toBe(NO_CHANGE);
  });

  it("shows everything again with undefined", () => {
    const filtered = { ...SNAPSHOT, filter: { groups: ["N"] } };
    expect(setFilter(filtered, undefined).patch).toEqual({ filter: undefined });
  });

  it("rejects something that is not a filter", () => {
    expect(() => setFilter(SNAPSHOT, "N" as never)).toThrow(/^setFilter: filter must be /);
  });
});
