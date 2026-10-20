import { adoptStyles } from "../adopted-styles";

/** The class of the element the map is drawn in, inside `<maplace-map>`. */
export const PANE_CLASS = "maplace-map-pane";
/** Marks the list the element places, whichever view built it. */
export const PLACED_LIST_CLASS = "maplace-placed-list";

const BESIDE =
  ':where(maplace-map[list]:not([list-position]), maplace-map[list-position="outside"])';

/** Below this width the list goes under the map: beside it, the map would be a sliver. */
const NARROW = "(width < 40rem)";

/** Every selector in `:where()`, so any rule of the page wins: the height it sets, first of all. */
export const DEFAULT_STYLES = `
:where(maplace-map) { display: block; position: relative; height: 24rem; }
:where(maplace-location) { display: none; }
:where(.${PANE_CLASS}) { height: 100%; }
${BESIDE} { display: flex; }
${BESIDE} > :where(.${PANE_CLASS}) { flex: 1 1 auto; min-width: 0; }
${BESIDE} > :where(.${PLACED_LIST_CLASS}) { flex: 0 1 16rem; }
@media ${NARROW} {
${BESIDE} { flex-direction: column; }
${BESIDE} > :where(.${PLACED_LIST_CLASS}) { flex: none; max-height: 40%; }
}
`;

/** Adds the elements' default styles to `document`, once. */
export function adoptDefaultStyles(document: Document): void {
  adoptStyles(document, DEFAULT_STYLES);
}
