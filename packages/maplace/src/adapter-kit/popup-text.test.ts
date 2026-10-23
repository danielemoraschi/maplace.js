// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { selectorsOf, unguardedSelectorsOf, weighsNothing } from "../testing/selectors";
import { POPUP_TEXT_RULE } from "./popup-text";

describe("POPUP_TEXT_RULE", () => {
  it("is one rule for the content and the heading, weighing nothing and off inside the opt-out", () => {
    const selectors = selectorsOf(POPUP_TEXT_RULE);
    expect(selectors).toHaveLength(1);
    expect(selectors.every(weighsNothing)).toBe(true);
    expect(unguardedSelectorsOf(POPUP_TEXT_RULE)).toEqual([]);
  });
});
