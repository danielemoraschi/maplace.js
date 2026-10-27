import { outsideUnstyled } from "../unstyled";
import { AREA_ONLY_CLASS, EMPTY_AREA_CLASS, SHOW_ALL_CLASS } from "./area-filter";
import { LIST_CLASS, LIST_HEADING_CLASS } from "./list-block";
import {
  FIT_ALL_CLASS,
  GROUP_CLASS,
  HEADING_CLASS,
  LISTBOX_CLASS,
  OPTION_CLASS,
} from "./listbox-nodes";

/** Both kinds of entry: a location's option, and "fit all". */
const ENTRY = `:is(.${OPTION_CLASS},.${FIT_ALL_CLASS})`;

/** Both buttons of a list with `scope`: "This area only" and "Show all". */
const AREA_BUTTON = `:is(.${AREA_ONLY_CLASS},.${SHOW_ALL_CLASS})`;

/**
 * The listbox as a column of buttons, on a light page or a dark one: its colours are mixed from
 * the text's own (`currentColor`). Every selector is in `:where()`, so any rule of the page wins;
 * the native `<select>` keeps the browser's look. A heading, the "This area only" and "Show all"
 * buttons and the empty-area status stay in view over entries that scroll; none sets `display`,
 * so `hidden` holds. All of it turns off inside the opt-out (`unstyled.ts`).
 */
export const LIST_STYLES = `
${outsideUnstyled(`.${LISTBOX_CLASS}`)}{padding:.25rem;overflow:auto}
${outsideUnstyled(`.${LIST_CLASS}:not([hidden])`)}{display:flex;flex-direction:column}
${outsideUnstyled(`.${LIST_CLASS}>.${LISTBOX_CLASS}`)}{min-height:0}
${outsideUnstyled(`.${LIST_HEADING_CLASS}`)}{flex:none;padding:.5rem .75rem .25rem;font-weight:600}
${outsideUnstyled(AREA_BUTTON)}{flex:none;margin:.25rem;padding:.5rem .75rem;border:1px solid color-mix(in srgb,currentColor 30%,transparent);border-radius:.375rem;background:none;color:inherit;font:inherit;font-weight:600;cursor:pointer}
${outsideUnstyled(`${AREA_BUTTON}:hover`)}{background:color-mix(in srgb,currentColor 8%,transparent)}
${outsideUnstyled(`${AREA_BUTTON}:focus-visible`)}{outline:2px solid currentColor;outline-offset:1px}
${outsideUnstyled(`.${EMPTY_AREA_CLASS}`)}{flex:none;padding:.5rem .75rem;opacity:.7}
${outsideUnstyled(`.${EMPTY_AREA_CLASS}:focus-visible`)}{outline:2px solid currentColor;outline-offset:-2px}
${outsideUnstyled(`.${GROUP_CLASS}`)}{padding-top:.25rem}
${outsideUnstyled(`.${HEADING_CLASS}`)}{padding:.5rem .75rem .25rem;font-size:.75rem;letter-spacing:.05em;text-transform:uppercase;opacity:.7}
${outsideUnstyled(ENTRY)}{display:block;padding:.5rem .75rem;border-radius:.375rem;cursor:pointer}
${outsideUnstyled(`${ENTRY}[data-hovered]`)}{background:color-mix(in srgb,currentColor 8%,transparent)}
${outsideUnstyled(`${ENTRY}[data-selected]`)}{background:color-mix(in srgb,currentColor 16%,transparent);font-weight:600}
${outsideUnstyled(`${ENTRY}:focus-visible`)}{outline:2px solid currentColor;outline-offset:-2px}
`;
