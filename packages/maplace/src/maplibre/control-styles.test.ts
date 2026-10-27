// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { SHARED_CONTROL_STYLES } from "../adapter-kit/control-styles";
import { selectorsOf, unguardedSelectorsOf, weighsNothing } from "../testing/selectors";
import { LIST_CLASS } from "../views/list-block";
import { LISTBOX_CLASS } from "../views/listbox-nodes";
import { CONTROL_STYLES } from "./control-styles";

/** The sheet's own rules: all of it but the shared rules it ends with. */
const OWN_STYLES = CONTROL_STYLES.slice(0, -SHARED_CONTROL_STYLES.length);

describe("CONTROL_STYLES on MapLibre", () => {
  it("weighs nothing, so any rule of the page wins", () => {
    const selectors = selectorsOf(CONTROL_STYLES);
    expect(selectors.length).toBeGreaterThan(0);
    expect(selectors.filter((selector) => !weighsNothing(selector))).toEqual([]);
  });

  it("keeps its own rules to MapLibre's panels, and the corner holding one, by their class", () => {
    const own = selectorsOf(OWN_STYLES);
    const named = /\.maplibregl-ctrl\.maplace-control\b/;
    expect(own.length).toBeGreaterThan(0);
    expect(own.filter((selector) => !named.test(selector))).toEqual([]);
  });

  it("keeps maplace's own lists within the map by the classes the list views give them", () => {
    const named = (className: string) =>
      selectorsOf(CONTROL_STYLES).some((selector) =>
        new RegExp(`\\.${className}(?![\\w-])`).test(selector),
      );
    expect([named(LIST_CLASS), named(LISTBOX_CLASS)]).toEqual([true, true]);
  });

  it("turns off inside the opt-out but for hiding a panel whose list is hidden", () => {
    expect(unguardedSelectorsOf(CONTROL_STYLES)).toEqual([
      ":where(.maplace-control:has(>[hidden]:only-child))",
    ]);
  });

  it("ends with the rules every provider's panels share, so a page holding both sheets gets them alike", () => {
    expect(CONTROL_STYLES.endsWith(SHARED_CONTROL_STYLES)).toBe(true);
  });
});
