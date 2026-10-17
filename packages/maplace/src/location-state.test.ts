import { describe, expect, it } from "vitest";
import type { Location } from "./location";
import { changedIds, isShown, locationById, sameState, stateIn } from "./location-state";

describe("stateIn", () => {
  it("reads one location's selection and hover", () => {
    const state = { selectedId: "a", hoveredId: "b" };
    expect(stateIn(state, "a")).toEqual({ selected: true, hovered: false });
    expect(stateIn(state, "b")).toEqual({ selected: false, hovered: true });
    expect(stateIn(state, "c")).toEqual({ selected: false, hovered: false });
  });
});

describe("sameState", () => {
  it("compares selection and hover", () => {
    const plain = { selected: false, hovered: false };
    expect(sameState(plain, { ...plain })).toBe(true);
    expect(sameState(plain, { ...plain, hovered: true })).toBe(false);
    expect(sameState(plain, { ...plain, selected: true })).toBe(false);
  });
});

describe("changedIds", () => {
  it("names the ids whose selection or hover changed, once each", () => {
    const previous = { selectedId: "a", hoveredId: "b" };
    const next = { selectedId: "b", hoveredId: "b" };
    expect(changedIds(previous, next).sort((x, y) => x.localeCompare(y))).toEqual(["a", "b"]);
  });

  it("names nothing when selection and hover stay", () => {
    const state = { selectedId: "a", hoveredId: undefined };
    expect(changedIds(state, { ...state })).toEqual([]);
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

describe("locationById", () => {
  it("finds a location by id, or undefined", () => {
    const b: Location = { id: "b", lat: 0, lng: 0 };
    const locations = Object.freeze([{ id: "a", lat: 0, lng: 0 }, b]);
    expect(locationById(locations, "b")).toBe(b);
    expect(locationById(locations, "c")).toBeUndefined();
  });
});
