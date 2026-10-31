// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { selectorsOf, unguardedSelectorsOf, weighsNothing } from "../testing/selectors";
import { DEFAULT_STYLES } from "./default-styles";

describe("DEFAULT_STYLES", () => {
  it("weighs nothing, so any rule of the page wins", () => {
    const selectors = selectorsOf(DEFAULT_STYLES);
    expect(selectors.length).toBeGreaterThan(0);
    expect(selectors.filter((selector) => !weighsNothing(selector))).toEqual([]);
  });

  it("turns off inside the opt-out but for what maplace's markup needs", () => {
    const required = unguardedSelectorsOf(DEFAULT_STYLES);
    expect(required).toEqual([
      ":where(maplace-map)",
      ":where(maplace-location)",
      ":where(.maplace-map-pane)",
      ":where(maplace-map:not(:state(idle))>[data-maplace-idle],maplace-map:not(:state(idle)) .maplace-load-panel)",
      ":where(maplace-map:state(idle):has(>[data-maplace-idle])>.maplace-map-pane)",
    ]);
  });
});
