import { describe, expect, it } from "vitest";
import type { PresentationState } from "../adapter";
import { changedIds, NOTHING_PRESENTED, stateIn, visibilityChanges } from "./presentation-changes";

function presented(state: Partial<PresentationState>): PresentationState {
  return { ...NOTHING_PRESENTED, ...state };
}

describe("stateIn", () => {
  it("reads one location's selection and hover", () => {
    const state = presented({ selectedId: "a", hoveredId: "b" });
    expect(stateIn(state, "a")).toEqual({ selected: true, hovered: false });
    expect(stateIn(state, "b")).toEqual({ selected: false, hovered: true });
    expect(stateIn(state, "c")).toEqual({ selected: false, hovered: false });
  });
});

describe("changedIds", () => {
  it("names the ids whose selection or hover changed, once each", () => {
    const previous = presented({ selectedId: "a", hoveredId: "b" });
    const next = presented({ selectedId: "b", hoveredId: "b" });
    expect(changedIds(previous, next).sort((x, y) => x.localeCompare(y))).toEqual(["a", "b"]);
  });

  it("names nothing when only the hidden ids changed", () => {
    const previous = presented({ selectedId: "a" });
    expect(changedIds(previous, { ...previous, hiddenIds: new Set(["a"]) })).toEqual([]);
  });
});

describe("visibilityChanges", () => {
  it("names the ids hidden or shown again", () => {
    const previous = presented({ hiddenIds: new Set(["a", "b"]) });
    const next = presented({ hiddenIds: new Set(["b", "c"]) });
    expect(visibilityChanges(previous, next).sort((x, y) => x.localeCompare(y))).toEqual([
      "a",
      "c",
    ]);
  });

  it("names nothing when the hidden ids kept their reference", () => {
    const hiddenIds = new Set(["a"]);
    const previous = presented({ hiddenIds });
    expect(visibilityChanges(previous, presented({ hiddenIds, selectedId: "a" }))).toEqual([]);
  });
});
