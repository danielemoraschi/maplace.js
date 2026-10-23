/** The stylesheets already adopted by each document, by their text. */
const adopted = new WeakMap<Document, Set<string>>();

/**
 * Adds `css` to `document` once, before the page's own sheets so any rule of the page wins: an
 * adopted sheet rather than a `<style>` tag, which a page's content security policy would need a
 * nonce for.
 */
export function adoptStyles(document: Document, css: string): void {
  // A DOM without constructable stylesheets (jsdom, Safari before 16.4) goes without the defaults,
  // as does a document with no window (`createHTMLDocument`'s), which shows nothing: a document
  // adopts only the sheets its own window made, a frame's included.
  const view = document.defaultView;
  if (!("adoptedStyleSheets" in document) || view === null) return;
  const sheets = adopted.get(document) ?? new Set<string>();
  if (sheets.has(css)) return;
  sheets.add(css);
  adopted.set(document, sheets);
  const sheet = new view.CSSStyleSheet();
  sheet.replaceSync(css);
  document.adoptedStyleSheets = [sheet, ...document.adoptedStyleSheets];
}
