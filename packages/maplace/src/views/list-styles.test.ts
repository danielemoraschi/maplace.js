// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import {
  hoverSelectorsOutsideHoverMedia,
  selectorsOf,
  unguardedSelectorsOf,
  weighsNothing,
} from "../testing/selectors";
import { LIST_STYLES } from "./list-styles";

describe("LIST_STYLES", () => {
  it("weighs nothing, so any rule of the page wins", () => {
    const selectors = selectorsOf(LIST_STYLES);
    expect(selectors.length).toBeGreaterThan(0);
    expect(selectors.filter((selector) => !weighsNothing(selector))).toEqual([]);
  });

  it("turns off inside the opt-out, every rule of it", () => {
    expect(unguardedSelectorsOf(LIST_STYLES)).toEqual([]);
  });

  it("tints under the pointer only where something can hover, so a tap leaves no tint", () => {
    expect(hoverSelectorsOutsideHoverMedia(LIST_STYLES)).toEqual([]);
  });
});
