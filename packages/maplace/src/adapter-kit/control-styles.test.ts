// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { selectorsOf, unguardedSelectorsOf, weighsNothing } from "../testing/selectors";
import { SHARED_CONTROL_STYLES } from "./control-styles";

describe("SHARED_CONTROL_STYLES", () => {
  it("weighs nothing, so any rule of the page wins", () => {
    const selectors = selectorsOf(SHARED_CONTROL_STYLES);
    expect(selectors.length).toBeGreaterThan(0);
    expect(selectors.filter((selector) => !weighsNothing(selector))).toEqual([]);
  });

  it("styles every provider's panel by the class they share, and by no provider's own", () => {
    const selectors = selectorsOf(SHARED_CONTROL_STYLES);
    const providers = /maplibregl|\[data-color-scheme|maplace-google-map/;
    expect(selectors.filter((selector) => !/\.maplace-control\b/.test(selector))).toEqual([]);
    expect(selectors.filter((selector) => providers.test(selector))).toEqual([]);
  });

  it("turns off inside the opt-out but for hiding a panel whose list is hidden", () => {
    expect(unguardedSelectorsOf(SHARED_CONTROL_STYLES)).toEqual([
      ":where(.maplace-control:has(>[hidden]:only-child))",
    ]);
  });
});
