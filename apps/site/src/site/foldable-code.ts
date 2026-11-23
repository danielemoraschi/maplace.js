// Which code blocks fold (W79), decided when the site is built, so a long block is drawn folded
// from the page's first paint (`styles/code.css`), not folded by `code-fold.ts` a frame later.

/** A block of this many lines or more is folded: about 1.5 times the lines its fold shows. */
export const FOLD_FROM_LINES = 16;

/** The marks a block of `code` carries if it folds: that it does, and its lines, for its button. */
export function foldMarks(code: string): Record<string, string> {
  const lines = code.trimEnd().split("\n").length;
  return lines >= FOLD_FROM_LINES ? { "data-foldable": "", "data-lines": String(lines) } : {};
}

/** Shiki's `pre`, as a transformer sees it. */
interface PreNode {
  properties: Record<string, unknown>;
}

/** A Shiki transformer marking each block it renders with `foldMarks`, for `<Code>` and Markdown. */
export const foldableCode = {
  name: "maplace-foldable-code",
  pre(this: { source: string }, node: PreNode): void {
    Object.assign(node.properties, foldMarks(this.source));
  },
};
