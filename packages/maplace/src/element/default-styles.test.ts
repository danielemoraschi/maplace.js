// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { selectorsOf, weighsNothing } from "../testing/selectors";
import { DEFAULT_STYLES } from "./default-styles";

describe("DEFAULT_STYLES", () => {
  it("weighs nothing, so any rule of the page wins", () => {
    const selectors = selectorsOf(DEFAULT_STYLES);
    expect(selectors.length).toBeGreaterThan(0);
    expect(selectors.filter((selector) => !weighsNothing(selector))).toEqual([]);
  });
});
