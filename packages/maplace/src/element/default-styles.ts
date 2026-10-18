import { adoptStyles } from "../adopted-styles";

/** The class of the element the map is drawn in, inside `<maplace-map>`. */
export const PANE_CLASS = "maplace-map-pane";
/** Marks the list the element places, whichever view built it. */
export const PLACED_LIST_CLASS = "maplace-placed-list";

const BESIDE =
  ':where(maplace-map[list]:not([list-position]), maplace-map[list-position="outside"])';

/** Every selector in `:where()`, so any rule of the page's wins. */
export const DEFAULT_STYLES = `
:where(maplace-map) { display: block; position: relative; }
:where(maplace-location) { display: none; }
:where(.${PANE_CLASS}) { height: 100%; }
${BESIDE} { display: flex; }
${BESIDE} > :where(.${PANE_CLASS}) { flex: 1 1 auto; min-width: 0; }
${BESIDE} > :where(.${PLACED_LIST_CLASS}) { flex: 0 1 16rem; }
`;

/** Adds the elements' default styles to `document`, once. */
export function adoptDefaultStyles(document: Document): void {
  adoptStyles(document, DEFAULT_STYLES);
}
