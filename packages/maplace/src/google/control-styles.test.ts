// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { selectorsOf, weighsNothing } from "../testing/selectors";
import { CONTROL_STYLES } from "./control-styles";

describe("CONTROL_STYLES", () => {
  it("weighs nothing, so any rule of the page wins", () => {
    const selectors = selectorsOf(CONTROL_STYLES);
    expect(selectors.length).toBeGreaterThan(0);
    expect(selectors.filter((selector) => !weighsNothing(selector))).toEqual([]);
  });

  it("styles the panel by its class, and sizes it against the map maplace creates", () => {
    const named = /\.maplace-(control|google-map)\b/;
    expect(selectorsOf(CONTROL_STYLES).filter((selector) => !named.test(selector))).toEqual([]);
  });
});
