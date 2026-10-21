// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { selectorsOf, unguardedSelectorsOf, weighsNothing } from "../testing/selectors";
import { POPUP_STYLES } from "./popup-styles";

describe("POPUP_STYLES", () => {
  it("weighs nothing, so any rule of the page wins", () => {
    const selectors = selectorsOf(POPUP_STYLES);
    expect(selectors.length).toBeGreaterThan(0);
    expect(selectors.filter((selector) => !weighsNothing(selector))).toEqual([]);
  });

  it("turns off inside the opt-out, every rule of it", () => {
    expect(unguardedSelectorsOf(POPUP_STYLES)).toEqual([]);
  });
});
