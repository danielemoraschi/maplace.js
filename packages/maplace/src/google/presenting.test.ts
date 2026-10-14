import { describe, expect, it } from "vitest";
import type { PresentationState } from "../adapter";
import { NOTHING_PRESENTED } from "../adapter-kit/presentation-changes";
import { createMapState } from "./map-state";
import type { Look, PlacedLocation } from "./placed-location";
import { createPresenting, lookIn } from "./presenting";

function presented(state: Partial<PresentationState>): PresentationState {
  return { ...NOTHING_PRESENTED, ...state };
}

/** A map state holding locations that record the looks they are given. */
function stateWith(...ids: string[]) {
  const state = createMapState();
  const looks: [string, Look][] = [];
  for (const id of ids) {
    const present = (look: Look) => looks.push([id, look]);
    state.placed.set(id, { present } as unknown as PlacedLocation);
  }
  return { state, looks, present: createPresenting(state) };
}

describe("lookIn", () => {
  it("reads a location's state and whether it is shown", () => {
    expect(lookIn(presented({ selectedId: "a", hiddenIds: new Set(["a"]) }), "a")).toEqual({
      state: { selected: true, hovered: false },
      visible: false,
    });
  });
});

describe("createPresenting", () => {
  it("gives a new look only to the locations whose look changed", () => {
    const { looks, present } = stateWith("a", "b", "c");
    present(presented({ selectedId: "a", hiddenIds: new Set(["c"]) }));
    expect(looks.map(([id]) => id).sort((x, y) => x.localeCompare(y))).toEqual(["a", "c"]);
  });

  it("keeps the presentation for locations placed later", () => {
    const { state, present } = stateWith();
    const next = presented({ hoveredId: "later" });
    present(next);
    expect(state.presented).toBe(next);
  });

  it("gives nothing when only an unplaced location changed", () => {
    const { looks, present } = stateWith("a");
    present(presented({ selectedId: "later" }));
    expect(looks).toEqual([]);
  });
});
