/** The stylesheets already adopted by each document, by their text. */
const adopted = new WeakMap<Document, Set<string>>();

/**
 * Adds `css` to `document` once, before the page's own sheets so any rule of the page wins: an
 * adopted sheet rather than a `<style>` tag, which a page's content security policy would need a
 * nonce for.
 */
export function adoptStyles(document: Document, css: string): void {
  // A DOM without constructable stylesheets (jsdom, Safari before 16.4) goes without the defaults.
  if (!("adoptedStyleSheets" in document)) return;
  const sheets = adopted.get(document) ?? new Set<string>();
  if (sheets.has(css)) return;
  sheets.add(css);
  adopted.set(document, sheets);
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(css);
  document.adoptedStyleSheets = [sheet, ...document.adoptedStyleSheets];
}
