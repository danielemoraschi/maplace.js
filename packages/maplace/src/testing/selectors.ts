import { OUTSIDE_UNSTYLED } from "../unstyled";

/** The text of every rule in `sheet`, as the DOM writes it back. */
export function cssTextOf(sheet: CSSStyleSheet): string {
  return Array.from(sheet.cssRules, (rule) => rule.cssText).join("");
}

/** Each rule's selector text in `css`, as the DOM parses it, the rules in `@media` included. */
export function selectorsOf(css: string): string[] {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(css);
  return styleRulesIn(sheet.cssRules).map(({ selectorText }) => selectorText);
}

/** The style rules in `rules`, those in a group (`@media`) too: read by shape, as DOMs differ. */
function styleRulesIn(rules: CSSRuleList): CSSStyleRule[] {
  return Array.from(rules).flatMap((rule) => {
    if ("selectorText" in rule) return [rule as CSSStyleRule];
    return "cssRules" in rule ? styleRulesIn((rule as CSSGroupingRule).cssRules) : [];
  });
}

/**
 * Whether `selector` weighs nothing, so any rule of a page wins over it: all of it is inside
 * `:where(…)`, with only combinators, commas and spaces between.
 */
export function weighsNothing(selector: string): boolean {
  return withoutWhereGroups(selector).replaceAll(/[\s>+~,]/g, "") === "";
}

/** The selectors in `css` the opt-out leaves on: the rules maplace's own markup needs. */
export function unguardedSelectorsOf(css: string): string[] {
  return selectorsOf(css).filter((selector) => !isGuarded(selector));
}

/**
 * Whether `selector` is a default rule's, written by `outsideUnstyled`: one `:where(…)` group, then
 * the opt-out's guard, compared without spaces, as DOMs write them back differently.
 */
export function isGuarded(selector: string): boolean {
  const compact = withoutSpaces(selector);
  const guard = withoutSpaces(`:where(${OUTSIDE_UNSTYLED})`);
  if (!compact.startsWith(":where(") || !compact.endsWith(guard)) return false;
  return afterGroup(compact, ":where".length) === compact.length - guard.length;
}

function withoutSpaces(text: string): string {
  return text.replaceAll(/\s/g, "");
}

/** `selector` with each `:where(…)` group taken out, nested parentheses included. */
function withoutWhereGroups(selector: string): string {
  let rest = "";
  let index = 0;
  while (index < selector.length) {
    if (selector.startsWith(":where(", index)) {
      index = afterGroup(selector, index + ":where".length);
    } else {
      rest += selector[index];
      index += 1;
    }
  }
  return rest;
}

/** The index after the parenthesised group opening at `open`. */
function afterGroup(text: string, open: number): number {
  let depth = 0;
  for (let index = open; index < text.length; index++) {
    if (text[index] === "(") depth++;
    if (text[index] === ")") depth--;
    if (depth === 0) return index + 1;
  }
  return text.length;
}
