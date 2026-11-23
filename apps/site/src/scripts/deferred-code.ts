/**
 * An example's versions but the first keep their code in a template (`ExampleSection.astro`, W83),
 * so search reads one version and the page stays small: written in once its tab and provider show.
 */

/** A deferred part's template, its version's panel and its provider both shown. */
const SHOWN_DEFERRED =
  '[role="tabpanel"]:not([hidden]) > [data-provider-files]:not([hidden]) > template[data-deferred-files]';

/** Writes in the code of every shown part under `root` still in its template, each `prepare`d. */
export function expandShownCode(root: ParentNode, prepare: (part: Element) => void): void {
  for (const template of root.querySelectorAll<HTMLTemplateElement>(SHOWN_DEFERRED)) {
    // The selector's own parent: a shown `[data-provider-files]`.
    const part = template.parentElement as Element;
    template.replaceWith(template.content);
    prepare(part);
  }
}
