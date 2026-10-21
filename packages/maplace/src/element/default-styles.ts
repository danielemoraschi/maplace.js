import { adoptStyles } from "../adopted-styles";
import { outsideUnstyled } from "../unstyled";

/** The class of the element the map is drawn in, inside `<maplace-map>`. */
export const PANE_CLASS = "maplace-map-pane";
/** Marks the list the element places, whichever view built it. */
export const PLACED_LIST_CLASS = "maplace-placed-list";

const BESIDE = 'maplace-map[list]:not([list-position]),maplace-map[list-position="outside"]';

/** Below this width the list goes under the map: beside it, the map would be a sliver. */
const NARROW = "(width < 40rem)";

/**
 * Every selector in `:where()`, so any rule of the page wins: the height it sets, first of all.
 * Inside the opt-out (`unstyled.ts`) only what the elements need stays: a location's markup
 * hidden, the element a block and its pane filling it.
 */
export const DEFAULT_STYLES = `
:where(maplace-map){display:block}
:where(maplace-location){display:none}
:where(.${PANE_CLASS}){height:100%}
${outsideUnstyled("maplace-map")}{position:relative;height:24rem}
${outsideUnstyled(BESIDE)}{display:flex}
${outsideUnstyled(`:is(${BESIDE})>.${PANE_CLASS}`)}{flex:1 1 auto;min-width:0}
${outsideUnstyled(`:is(${BESIDE})>.${PLACED_LIST_CLASS}`)}{flex:0 1 16rem}
@media ${NARROW}{
${outsideUnstyled(BESIDE)}{flex-direction:column}
${outsideUnstyled(`:is(${BESIDE})>.${PLACED_LIST_CLASS}`)}{flex:none;max-height:40%}
}
`;

/** Adds the elements' default styles to `document`, once. */
export function adoptDefaultStyles(document: Document): void {
  adoptStyles(document, DEFAULT_STYLES);
}
