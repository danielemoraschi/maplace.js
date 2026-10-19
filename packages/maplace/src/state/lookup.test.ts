import { describe, expect, it } from "vitest";
import type { Location } from "../location";
import { frozenList, isUnselectableId } from "./lookup";

describe("frozenList", () => {
  it("copies and freezes, so the caller's later changes don't reach it", () => {
    const list: Location[] = [{ id: "a", lat: 0, lng: 0 }];
    const frozen = frozenList(list);
    list.push({ id: "b", lat: 0, lng: 0 });
    expect(frozen).toHaveLength(1);
    expect(Object.isFrozen(frozen)).toBe(true);
  });
});

describe("isUnselectableId", () => {
  it("is true only for an id that is set and names no shown location", () => {
    const locations: Location[] = [
      { id: "a", lat: 0, lng: 0, group: "N" },
      { id: "b", lat: 0, lng: 0, visible: false },
    ];
    const scope = { locations, filter: undefined };
    expect(isUnselectableId(scope, undefined)).toBe(false);
    expect(isUnselectableId(scope, "a")).toBe(false);
    expect(isUnselectableId({ locations, filter: ["S"] }, "a")).toBe(true);
    expect(isUnselectableId(scope, "b")).toBe(true);
    expect(isUnselectableId(scope, "gone")).toBe(true);
  });
});
