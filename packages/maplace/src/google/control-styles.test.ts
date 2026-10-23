// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { SHARED_CONTROL_STYLES } from "../adapter-kit/control-styles";
import { selectorsOf, unguardedSelectorsOf, weighsNothing } from "../testing/selectors";
import { LIST_CLASS } from "../views/headed";
import { LISTBOX_CLASS } from "../views/listbox-nodes";
import { CONTROL_STYLES } from "./control-styles";

/** The sheet's own rules: all of it but the shared rules it ends with. */
const OWN_STYLES = CONTROL_STYLES.slice(0, -SHARED_CONTROL_STYLES.length);

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

  it("keeps the panel's look and its lists' height to the panels Google holds, each carrying its scheme", () => {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(CONTROL_STYLES);
    const lookAndHeight = Array.from(sheet.cssRules as Iterable<CSSStyleRule>)
      .filter((rule) => /box-shadow|max-height/.test(rule.style.cssText))
      .map((rule) => rule.selectorText);
    expect(lookAndHeight.length).toBeGreaterThan(0);
    expect(
      lookAndHeight.filter((selector) => !selector.includes(".maplace-control[data-color-scheme]")),
    ).toEqual([]);
  });

  it("keeps its own rules to Google's panels, each carrying its scheme, and the map maplace creates", () => {
    const own = selectorsOf(OWN_STYLES);
    const named = /\[data-color-scheme|\.maplace-google-map\b/;
    expect(own.length).toBeGreaterThan(0);
    expect(own.filter((selector) => !named.test(selector))).toEqual([]);
  });

  it("ends with the rules every provider's panels share, so a page holding both sheets gets them alike", () => {
    expect(CONTROL_STYLES.endsWith(SHARED_CONTROL_STYLES)).toBe(true);
  });
});
