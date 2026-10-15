/** The class of the element the map is drawn in, inside `<maplace-map>`. */
export const PANE_CLASS = "maplace-map-pane";

const BESIDE =
  ':where(maplace-map[list]:not([list-position]), maplace-map[list-position="outside"])';

/** Every selector in `:where()`, so any rule of the page's wins. */
const DEFAULT_STYLES = `
:where(maplace-map) { display: block; position: relative; }
:where(maplace-location) { display: none; }
:where(.${PANE_CLASS}) { height: 100%; }
${BESIDE} { display: flex; }
${BESIDE} > :where(.${PANE_CLASS}) { flex: 1 1 auto; min-width: 0; }
${BESIDE} > :where([role="listbox"], select) { flex: 0 1 16rem; overflow: auto; }
`;

const adopted = new WeakSet<Document>();

/**
 * Adds the elements' default styles to `document` once: an adopted sheet rather than a `<style>`
 * tag, which a page's content security policy would need a nonce for.
 */
export function adoptDefaultStyles(document: Document): void {
  if (adopted.has(document)) return;
  adopted.add(document);
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(DEFAULT_STYLES);
  document.adoptedStyleSheets = [sheet, ...document.adoptedStyleSheets];
}
