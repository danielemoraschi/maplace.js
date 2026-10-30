import { describe, expect, it } from "vitest";
import type { Location } from "../location";
import { initialSnapshot } from "../state/initial";
import type { Snapshot } from "../store";
import { presentationOf } from "./presentation";

const locations: Location[] = [
  { id: "a", lat: 0, lng: 0, group: "N" },
  { id: "b", lat: 0, lng: 0, group: "S" },
  { id: "c", lat: 0, lng: 0, visible: false },
];
const first: Snapshot = initialSnapshot({ locations });

describe("presentationOf", () => {
  it("lists the ids hidden by visible: false or the filter", () => {
    const state = presentationOf(
      { ...first, filter: { groups: ["N"] }, selectedId: "a" },
      undefined,
    );
    expect(state.selectedId).toBe("a");
    expect([...state.hiddenIds].sort()).toEqual(["b", "c"]);
  });

  it("returns the last state when nothing in it changed", () => {
    const state = presentationOf(first, undefined);
    expect(
      presentationOf(
        { ...first, view: { kind: "fit-all", padding: 1 } },
        { snapshot: first, state },
      ),
    ).toBe(state);
  });

  it("keeps hiddenIds when the same ids are hidden, even with new locations or filter", () => {
    const state = presentationOf(first, undefined);
    const next = { ...first, locations: [...locations], selectedId: "a" };
    const after = presentationOf(next, { snapshot: first, state });
    expect(after).not.toBe(state);
    expect(after.hiddenIds).toBe(state.hiddenIds);
    const filtered = presentationOf(
      { ...next, filter: { groups: ["N"] } },
      { snapshot: next, state: after },
    );
    expect(filtered.hiddenIds).not.toBe(state.hiddenIds);
  });
});
