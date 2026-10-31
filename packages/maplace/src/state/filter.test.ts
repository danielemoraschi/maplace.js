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

describe("setFilter with a query", () => {
  const PLACES = Object.freeze([
    { id: "sp", ...at, title: "São Paulo", group: "Brazil", tags: ["parking"] },
    { id: "rm", ...at, title: "Rome Centre", group: "Italy", searchText: "Pasta Harbour" },
    { id: "kt", ...at, title: "कोटा" },
    { id: "untitled", ...at, data: { note: "pasta" } },
  ]);
  const places: Snapshot = { ...SNAPSHOT, locations: PLACES, selectedId: "rm" };
  const found = (request: Parameters<typeof setFilter>[1]) => {
    const filter = setFilter(places, request).patch.filter;
    return PLACES.filter((location) => isShown(location, filter)).map(({ id }) => id);
  };

  it("keeps what has every word", () => {
    expect(found({ query: "rome centre" })).toEqual(["rm"]);
    expect(found({ query: "centre rome" })).toEqual(["rm"]);
    expect(found({ query: "rome paulo" })).toEqual([]);
  });

  it("ignores case and accents", () => {
    expect(found({ query: "SAO" })).toEqual(["sp"]);
    expect(found({ query: "são" })).toEqual(["sp"]);
  });

  it("folds Greek's final sigma and German's sharp s", () => {
    const greek = { id: "g", ...at, title: "ΑΣΠΡΟ" };
    const german = { id: "d", ...at, title: "Straße" };
    const locations = Object.freeze([greek, german]);
    const under = (query: string) => {
      const filter = setFilter({ ...places, locations }, { query }).patch.filter;
      return locations.filter((location) => isShown(location, filter)).map(({ id }) => id);
    };
    expect(under("ΑΣ")).toEqual(["g"]);
    expect(under("ας")).toEqual(["g"]);
    expect(under("strasse")).toEqual(["d"]);
  });

  it("reads a location again when its text changed", () => {
    const place = { id: "m", ...at, title: "Old" };
    const filterFor = (query: string) => setFilter(places, { query }).patch.filter;
    expect(isShown(place, filterFor("old"))).toBe(true);
    place.title = "New";
    expect(isShown(place, filterFor("new"))).toBe(true);
    expect(isShown(place, filterFor("old"))).toBe(false);
  });

  it("leaves other scripts' vowels alone", () => {
    expect(found({ query: "कोटा" })).toEqual(["kt"]);
    expect(found({ query: "काट" })).toEqual([]);
  });

  it("looks in title, group and searchText", () => {
    expect(found({ query: "brazil" })).toEqual(["sp"]);
    expect(found({ query: "harbour" })).toEqual(["rm"]);
  });

  it("doesn't look in tags or data, or an id beside a title", () => {
    expect(found({ query: "parking" })).toEqual([]);
    expect(found({ query: "pasta" })).toEqual(["rm"]);
    expect(found({ query: "kt" })).toEqual([]);
  });

  it("finds an untitled location by its id, as the list names it", () => {
    expect(found({ query: "untitled" })).toEqual(["untitled"]);
  });

  it("asks for nothing with a blank query, leaving filter undefined", () => {
    expect(setFilter(places, { query: "  " })).toBe(NO_CHANGE);
    expect(found({ query: "" })).toEqual(["sp", "rm", "kt", "untitled"]);
  });

  it("must match tags and groups too", () => {
    expect(found({ query: "sao", tags: ["parking"] })).toEqual(["sp"]);
    expect(found({ query: "rome", tags: ["parking"] })).toEqual([]);
    expect(found({ query: "rome", groups: ["Brazil"] })).toEqual([]);
  });

  it("is trimmed, and the same query changes nothing", () => {
    const { patch } = setFilter(places, { query: " rome " });
    expect(patch.filter?.query).toBe("rome");
    expect(setFilter({ ...places, filter: patch.filter }, { query: "rome " })).toBe(NO_CHANGE);
  });

  it("deselects the selected location it hides", () => {
    expect(setFilter(places, { query: "sao" }).patch.selectedId).toBeUndefined();
    expect(setFilter(places, { query: "rome" }).patch).not.toHaveProperty("selectedId");
  });

  it("freezes the query's filter", () => {
    expect(Object.isFrozen(setFilter(places, { query: "rome" }).patch.filter)).toBe(true);
  });
});
