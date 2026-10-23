import { outsideUnstyled } from "../unstyled";

/**
 * The class of the element holding each control on a map, whichever provider draws it: the
 * control's panel, so a page's rule reaches every provider's.
 */
export const CONTROL_CLASS = "maplace-control";

const PANEL = `.${CONTROL_CLASS}`;

/**
 * The panel rules every provider's sheet ends with, the same text in each, so a page holding both
 * sheets gets them alike whichever it adopted first: form controls at the panel's size with room
 * to tap, and a panel whose list is hidden hidden too, inside the opt-out (`unstyled.ts`) as well,
 * where the rest is off. Every selector in `:where()`, so any rule of the page wins.
 */
export const SHARED_CONTROL_STYLES = `
:where(${PANEL}:has(>[hidden]:only-child)){display:none}
${outsideUnstyled(`${PANEL} :is(select,input,button)`)}{font:inherit}
${outsideUnstyled(`${PANEL} select`)}{min-height:2.25em}
${outsideUnstyled(`${PANEL} :is([type=radio],[type=checkbox])`)}{width:1.15em;height:1.15em;margin:.4em}
`;
