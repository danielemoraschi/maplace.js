// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { selectorsOf, unguardedSelectorsOf, weighsNothing } from "../testing/selectors";
import { LIST_CLASS } from "../views/headed";
import { LISTBOX_CLASS } from "../views/listbox-nodes";
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

  it("keeps maplace's own lists within the map by the classes the list views give them", () => {
    const named = (className: string) =>
      selectorsOf(CONTROL_STYLES).some((selector) =>
        new RegExp(`\\.${className}(?![\\w-])`).test(selector),
      );
    expect([named(LIST_CLASS), named(LISTBOX_CLASS)]).toEqual([true, true]);
  });

  it("turns off inside the opt-out but for hiding a panel whose list is hidden", () => {
    const required = unguardedSelectorsOf(CONTROL_STYLES);
    expect(required).toEqual([":where(.maplace-control:has(>[hidden]:only-child))"]);
  });
});
