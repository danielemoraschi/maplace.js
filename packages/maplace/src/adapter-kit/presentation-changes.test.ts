import { describe, expect, it } from "vitest";
import type { PresentationState } from "../adapter";
import { lookChanges, lookIn, NOTHING_PRESENTED, visibilityChanges } from "./presentation-changes";

function presented(state: Partial<PresentationState>): PresentationState {
  return { ...NOTHING_PRESENTED, ...state };
}

describe("lookIn", () => {
  it("reads a location's state and whether it is shown", () => {
    expect(lookIn(presented({ selectedId: "a", hiddenIds: new Set(["a"]) }), "a")).toEqual({
      state: { selected: true, hovered: false },
      visible: false,
    });
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

describe("lookChanges", () => {
  it("names the ids whose state changed and those hidden or shown again, each once", () => {
    const previous = presented({ selectedId: "a", hiddenIds: new Set(["b"]) });
    const next = presented({ selectedId: "c", hoveredId: "b", hiddenIds: new Set() });
    expect(lookChanges(previous, next)).toEqual(new Set(["a", "b", "c"]));
  });

  it("names nothing when nothing changed", () => {
    expect(lookChanges(NOTHING_PRESENTED, presented({}))).toEqual(new Set());
  });
});
