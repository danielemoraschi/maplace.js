// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import {
  CONTROL_CLASS as GOOGLE_CONTROL_CLASS,
  CONTROL_STYLES as GOOGLE_CONTROL_STYLES,
  GOOGLE_MAP_CLASS,
} from "../google/control-styles";
import { selectorsOf, unguardedSelectorsOf, weighsNothing } from "../testing/selectors";
import { LIST_CLASS } from "../views/headed";
import { LISTBOX_CLASS } from "../views/listbox-nodes";
import { CONTROL_CLASS, CONTROL_STYLES } from "./control-styles";

/** Each rule in `css` as written, one a line, keeping what a parser drops (`light-dark()`). */
const rulesOf = (css: string) => css.trim().split("\n");

/**
 * Whether a rule of Google's sheet also matches a panel on MapLibre: one keyed to neither the
 * panel's `data-color-scheme` nor Google's map element, which a MapLibre panel never has.
 */
const reachesMapLibrePanels = (rule: string) =>
  !rule.includes("[data-color-scheme") && !rule.includes(`.${GOOGLE_MAP_CLASS}`);

describe("CONTROL_STYLES on MapLibre", () => {
  it("weighs nothing, so any rule of the page wins", () => {
    const selectors = selectorsOf(CONTROL_STYLES);
    expect(selectors.length).toBeGreaterThan(0);
    expect(selectors.filter((selector) => !weighsNothing(selector))).toEqual([]);
  });

  it("styles only MapLibre's panels, and the corner holding one, by their class", () => {
    const named = /\.maplibregl-ctrl\.maplace-control\b/;
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
    expect(unguardedSelectorsOf(CONTROL_STYLES)).toEqual([
      ":where(.maplibregl-ctrl.maplace-control:has(>[hidden]:only-child))",
    ]);
  });

  it("names the panel with Google's class, so a page's rule reaches both", () => {
    expect(CONTROL_CLASS).toBe(GOOGLE_CONTROL_CLASS);
  });

  it("declares every rule of Google's sheet that also reaches MapLibre's panels the same way", () => {
    const shared = rulesOf(GOOGLE_CONTROL_STYLES).filter(reachesMapLibrePanels);
    const asOnGoogle = rulesOf(CONTROL_STYLES).map((rule) =>
      rule.replaceAll(".maplibregl-ctrl.maplace-control", ".maplace-control"),
    );
    expect(shared.length).toBeGreaterThan(0);
    expect(shared.filter((rule) => !asOnGoogle.includes(rule))).toEqual([]);
  });
});
