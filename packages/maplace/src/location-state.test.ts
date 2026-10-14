import { describe, expect, it } from "vitest";
import { changedIds, sameState, stateIn } from "./location-state";

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
