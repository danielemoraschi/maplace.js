// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { selectorsOf, weighsNothing } from "../testing/selectors";
import { LIST_STYLES } from "./list-styles";

describe("LIST_STYLES", () => {
  it("weighs nothing, so any rule of the page wins", () => {
    const selectors = selectorsOf(LIST_STYLES);
    expect(selectors.length).toBeGreaterThan(0);
    expect(selectors.filter((selector) => !weighsNothing(selector))).toEqual([]);
  });
});
