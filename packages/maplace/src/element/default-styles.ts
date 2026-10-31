import { adoptStyles } from "../adopted-styles";
import { outsideUnstyled } from "../unstyled";

/** The class of the element the map is drawn in, inside `<maplace-map>`. */
export const PANE_CLASS = "maplace-map-pane";
/** Marks the list the element places, whichever view built it. */
export const PLACED_LIST_CLASS = "maplace-placed-list";

/** The panel a held or lazy map shows until it loads: the class to style or hide it by. */
export const LOAD_PANEL_CLASS = "maplace-load-panel";
/** A child of the page's own, in place of the panel. */
export const OWN_PANEL_SELECTOR = ":scope>[data-maplace-idle]";

const OWN_PANEL = "[data-maplace-idle]";
const PANEL = `.${LOAD_PANEL_CLASS}`;

const BESIDE = 'maplace-map[list]:not([list-position]),maplace-map[list-position="outside"]';

/** Below this width the list goes under the map: beside it, the map would be a sliver. */
const NARROW = "(width < 40rem)";

/**
 * Every selector in `:where()`, so any rule of the page wins: the height it sets, first of all.
 * Inside the opt-out (`unstyled.ts`) only what the elements need stays: a location's markup
 * hidden, the element a block and its pane filling it, and which of pane and panel shows.
 *
 * The panel and the page's child are hidden outside `:state(idle)` with `!important`, so a page's
 * `display:grid` on its child can't keep it up over the map. The pane hides beside the page's child,
 * or the pane's full height would push the child out of the element. Those two rules are behaviour,
 * not look: they stay on in the opt-out.
 */
export const DEFAULT_STYLES = `
:where(maplace-map){display:block}
:where(maplace-location){display:none}
:where(.${PANE_CLASS}){height:100%}
${outsideUnstyled("maplace-map")}{position:relative;height:24rem}
${outsideUnstyled(BESIDE)}{display:flex}
${outsideUnstyled(`:is(${BESIDE})>:is(.${PANE_CLASS},${OWN_PANEL})`)}{flex:1 1 auto;min-width:0}
${outsideUnstyled(`:is(${BESIDE})>.${PLACED_LIST_CLASS}`)}{flex:0 1 16rem}
${outsideUnstyled(`maplace-map>${OWN_PANEL}`)}{height:100%}
:where(maplace-map:not(:state(idle))>${OWN_PANEL},maplace-map:not(:state(idle)) ${PANEL}){display:none!important}
:where(maplace-map:state(idle):has(>${OWN_PANEL})>.${PANE_CLASS}){display:none}
${outsideUnstyled(PANEL)}{display:grid;place-content:center;justify-items:center;gap:.75rem;height:100%;padding-inline:1rem;text-align:center;background:#8881}
${outsideUnstyled(`${PANEL}>button`)}{padding:.5rem 1rem;border:1px solid;border-radius:.375rem;background:none;color:inherit;font:inherit;font-weight:600;cursor:pointer}
@media ${NARROW}{
${outsideUnstyled(BESIDE)}{flex-direction:column}
${outsideUnstyled(`:is(${BESIDE})>.${PLACED_LIST_CLASS}`)}{flex:none;max-height:40%}
}
`;

/** Adds the elements' default styles to `document`, once. */
export function adoptDefaultStyles(document: Document): void {
  adoptStyles(document, DEFAULT_STYLES);
}
