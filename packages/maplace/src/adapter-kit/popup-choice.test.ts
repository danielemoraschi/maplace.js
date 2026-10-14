import { describe, expect, it } from "vitest";
import type { PresentationState } from "../adapter";
import { createPopupChoice } from "./popup-choice";
import { NOTHING_PRESENTED } from "./presentation-changes";

const presented = (state: Partial<PresentationState>) => ({ ...NOTHING_PRESENTED, ...state });

describe("createPopupChoice", () => {
  it("wants the selected location's popup with openOn 'click', the hovered one's with 'hover'", () => {
    const both = presented({ selectedId: "a", hoveredId: "b" });
    expect(createPopupChoice("click").wanted(both)).toBe("a");
    expect(createPopupChoice("hover").wanted(both)).toBe("b");
    expect(createPopupChoice("click").wanted(NOTHING_PRESENTED)).toBeUndefined();
  });

  it("wants no popup for a hidden location", () => {
    const hidden = presented({ selectedId: "a", hiddenIds: new Set(["a"]) });
    expect(createPopupChoice("click").wanted(hidden)).toBeUndefined();
  });

  it("keeps a popup the user closed closed until another location is wanted", () => {
    const choice = createPopupChoice("click");
    choice.dismiss("a");
    expect(choice.wanted(presented({ selectedId: "a" }))).toBeUndefined();
    expect(choice.wanted(presented({ selectedId: "b" }))).toBe("b");
    expect(choice.wanted(presented({ selectedId: "a" }))).toBe("a");
  });

  it("forgets a dismissal when nothing is wanted in between", () => {
    const choice = createPopupChoice("click");
    choice.dismiss("a");
    expect(choice.wanted(NOTHING_PRESENTED)).toBeUndefined();
    expect(choice.wanted(presented({ selectedId: "a" }))).toBe("a");
  });
});
