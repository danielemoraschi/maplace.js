/** Each rule's selector text in `css`, as the DOM parses it. */
export function selectorsOf(css: string): string[] {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(css);
  return Array.from(sheet.cssRules, (rule) => (rule as CSSStyleRule).selectorText);
}

/**
 * Whether `selector` weighs nothing, so any rule of a page wins over it: all of it is inside
 * `:where(…)`, with only combinators, commas and spaces between.
 */
export function weighsNothing(selector: string): boolean {
  return withoutWhereGroups(selector).replaceAll(/[\s>+~,]/g, "") === "";
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
