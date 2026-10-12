import { describe, expect, it } from "vitest";
import type { Location } from "../location";
import { frozenList, isShown, locationById } from "./lookup";

describe("locationById", () => {
  it("finds a location by id, or undefined", () => {
    const b: Location = { id: "b", lat: 0, lng: 0 };
    const locations = Object.freeze([{ id: "a", lat: 0, lng: 0 }, b]);
    expect(locationById(locations, "b")).toBe(b);
    expect(locationById(locations, "c")).toBeUndefined();
  });
});

describe("isShown", () => {
  const at = { lat: 0, lng: 0 };

  it("shows every visible location without a filter", () => {
    expect(isShown({ id: "a", ...at }, undefined)).toBe(true);
    expect(isShown({ id: "a", ...at, visible: true }, undefined)).toBe(true);
  });

  it("hides a location with visible: false, filter or not", () => {
    expect(isShown({ id: "a", ...at, visible: false }, undefined)).toBe(false);
    expect(isShown({ id: "a", ...at, visible: false, group: "N" }, ["N"])).toBe(false);
  });

  it("with a filter, shows only locations in its groups", () => {
    expect(isShown({ id: "a", ...at, group: "N" }, ["N"])).toBe(true);
    expect(isShown({ id: "a", ...at, group: "S" }, ["N"])).toBe(false);
  });

  it("with a filter, hides locations without a group", () => {
    expect(isShown({ id: "a", ...at }, ["N"])).toBe(false);
  });
});

describe("frozenList", () => {
  it("copies and freezes, so the caller's later changes don't reach it", () => {
    const list: Location[] = [{ id: "a", lat: 0, lng: 0 }];
    const frozen = frozenList(list);
    list.push({ id: "b", lat: 0, lng: 0 });
    expect(frozen).toHaveLength(1);
    expect(Object.isFrozen(frozen)).toBe(true);
  });
});
