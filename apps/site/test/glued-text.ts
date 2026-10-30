import type { Page } from "playwright";

/**
 * Text on `page` that runs into the link, code or emphasis beside it, as "Itsprivacy policy" or
 * "maplace-site:mapsset to": Astro's `"jsx"` HTML compression trims the line-break whitespace at
 * both edges of a text run, so a space a template means to keep there is written `{" "}`. Each is
 * the two sides, joined by a bar. Text glued to an `{expression}` becomes one text node with it,
 * told apart only where a sentence then runs into the next, as "the page asked for.Cloudflare";
 * `scripts/checks/glued-expressions.ts` finds the rest in the templates.
 */
export function gluedText(page: Page): Promise<string[]> {
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
    /** Where a sentence ends and the next starts with no space between. */
    const sentenceRunOn = /[a-z][.!?](?=[A-Z])/g;
    type Sides = readonly [string, string];
    const hasBothSides = (
      sides: readonly [string | undefined, string | undefined],
    ): sides is Sides => sides[0] !== undefined && sides[1] !== undefined;
    /** The two sides of each spot in `node`'s `text` where it runs into what's beside it. */
    const gluedSides = (node: Node, text: string): Sides[] => {
      const runOns = node.parentElement?.closest("code")
        ? []
        : [...text.matchAll(sentenceRunOn)].map(
            ({ index }): Sides => [text.slice(0, index + 2), text.slice(index + 2)],
          );
      const besideInline = [
        [text, inlineText(node.nextSibling)],
        [inlineText(node.previousSibling), text],
      ] as const;
      return [
        ...runOns,
        ...besideInline.filter(hasBothSides).filter(([left, right]) => runsInto(left, right)),
      ];
    };
    const glued: string[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (node.parentElement?.closest("pre, script, style, template")) continue;
      for (const [left, right] of gluedSides(node, node.textContent ?? "")) {
        glued.push(`${left.slice(-25)}|${right.slice(0, 25)}`);
      }
    }
    return glued;
  });
}
