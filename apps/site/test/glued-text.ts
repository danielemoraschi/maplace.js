import type { Page } from "playwright";

/**
 * Text that runs into the link, code or emphasis beside it on `page`, as "Itsprivacy policy" or
 * "maplace-site:mapsset to": Astro's `"jsx"` HTML compression trims the line-break whitespace at
 * both edges of a text run, so a space a template means to keep there is written `{" "}`. Each is
 * the two sides, joined by a bar. Text glued to an `{expression}` becomes one text node with it,
 * which no look at the page can tell apart.
 */
export function textGluedToInline(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const inline = new Set(["A", "CODE", "STRONG", "EM", "KBD"]);
    /** The text of `node` when it is a link, code or emphasis; none for anything else. */
    const inlineText = (node: Node | null) =>
      node instanceof HTMLElement && inline.has(node.tagName)
        ? (node.textContent ?? "")
        : undefined;
    /**
     * Whether `left` runs into `right`: it ends in a word or a sentence's punctuation, not an
     * opening bracket or quote, and `right` starts a word, not with closing punctuation or a
     * plural's `s`.
     */
    const runsInto = (left: string, right: string) =>
      /[^\s([{“"'‘]$/.test(left) && /^(?!s\b)[^\s,.;:!?)\]}”"'’]/.test(right);
    const glued: string[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (node.parentElement?.closest("pre, script, style, template")) continue;
      const text = node.textContent ?? "";
      const sides = [
        [text, inlineText(node.nextSibling)],
        [inlineText(node.previousSibling), text],
      ] as const;
      for (const [left, right] of sides) {
        if (left !== undefined && right !== undefined && runsInto(left, right)) {
          glued.push(`${left.slice(-25)}|${right.slice(0, 25)}`);
        }
      }
    }
    return glued;
  });
}
