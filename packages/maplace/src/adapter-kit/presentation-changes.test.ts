import { describe, expect, it } from "vitest";
import type { PresentationState } from "../adapter";
import { NOTHING_PRESENTED, visibilityChanges } from "./presentation-changes";

function presented(state: Partial<PresentationState>): PresentationState {
  return { ...NOTHING_PRESENTED, ...state };
}

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
