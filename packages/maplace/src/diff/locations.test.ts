import { describe, expect, it } from "vitest";
import type { LocationDiff } from "../adapter";
import type { Location } from "../location";
import type { DrawContext } from "./drawable";
import { type Drawn, diffLocations, NOTHING_DRAWN } from "./locations";

const CONTEXT: DrawContext = { sanitize: undefined, style: undefined };

function marker(id: string, lng = 0): Location {
  return { id, lat: 0, lng };
}

function draw(locations: readonly Location[]): Drawn {
  return diffLocations(NOTHING_DRAWN, locations, CONTEXT).drawn;
}

function ids(diff: LocationDiff) {
  return { added: diff.added.map(({ id }) => id), updated: diff.updated.map(({ id }) => id) };
}

describe("diffLocations", () => {
  it("adds every location on the first call, in order", () => {
    const { diff } = diffLocations(NOTHING_DRAWN, [marker("a"), marker("b")], CONTEXT);
    expect(ids(diff)).toEqual({ added: ["a", "b"], updated: [] });
    expect(diff.removed).toEqual([]);
  });

  it("leaves out locations whose object is the same", () => {
    const a = marker("a");
    const { diff } = diffLocations(draw([a, marker("b")]), [a, marker("b", 1)], CONTEXT);
    expect(ids(diff)).toEqual({ added: [], updated: ["b"] });
  });

  it("lists removed ids in their old order", () => {
    const a = marker("a");
    const { diff } = diffLocations(draw([marker("c"), a, marker("b")]), [a], CONTEXT);
    expect(diff.removed).toEqual(["c", "b"]);
  });

  it("lists added and updated locations in their new order", () => {
    const { diff } = diffLocations(
      draw([marker("a"), marker("b")]),
      [marker("d"), marker("b", 1), marker("c"), marker("a", 1)],
      CONTEXT,
    );
    expect(ids(diff)).toEqual({ added: ["d", "c"], updated: ["b", "a"] });
  });

  it("does not count a rebuilt location with equal fields as an update", () => {
    const before = draw([marker("a")]);
    const { drawn, diff } = diffLocations(before, [marker("a")], CONTEXT);
    expect(ids(diff)).toEqual({ added: [], updated: [] });
    expect(drawn.get("a")?.drawable).toBe(before.get("a")?.drawable);
  });

  it("remembers the new location object, even when its drawable was kept", () => {
    const next = marker("a");
    const { drawn } = diffLocations(draw([marker("a")]), [next], CONTEXT);
    expect(drawn.get("a")?.location).toBe(next);
  });

  it("removes and adds a location whose type changed", () => {
    const circle: Location = { id: "a", type: "circle", center: { lat: 0, lng: 0 }, radius: 5 };
    const { diff } = diffLocations(draw([marker("a")]), [circle], CONTEXT);
    expect(diff.removed).toEqual(["a"]);
    expect(ids(diff)).toEqual({ added: ["a"], updated: [] });
  });

  it("treats a missing type and marker as the same type", () => {
    const { diff } = diffLocations(
      draw([marker("a")]),
      [{ id: "a", type: "marker", lat: 0, lng: 1 }],
      CONTEXT,
    );
    expect(diff.removed).toEqual([]);
    expect(ids(diff)).toEqual({ added: [], updated: ["a"] });
  });

  it("diffs an array changed in place and passed again", () => {
    const locations = [marker("a")];
    const { drawn } = diffLocations(NOTHING_DRAWN, locations, CONTEXT);
    locations.push(marker("b"));
    expect(ids(diffLocations(drawn, locations, CONTEXT).diff)).toEqual({
      added: ["b"],
      updated: [],
    });
  });
});
