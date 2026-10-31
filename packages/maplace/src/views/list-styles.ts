import { outsideUnstyled } from "../unstyled";
import { AREA_SWITCH_CLASS, EMPTY_AREA_CLASS } from "./area-switch";
import { LIST_CLASS, LIST_HEADING_CLASS } from "./list-block";
import {
  FIT_ALL_CLASS,
  GROUP_CLASS,
  HEADING_CLASS,
  LISTBOX_CLASS,
  OPTION_CLASS,
} from "./listbox-nodes";
import { SEARCH_CLASS, SEARCH_STATUS_CLASS } from "./search-box";

/** Both kinds of entry: a location's option, and "fit all". */
const ENTRY = `:is(.${OPTION_CLASS},.${FIT_ALL_CLASS})`;

/** Both buttons of a list's area switch: "All" and "This area". */
const SWITCH_BUTTON = `.${AREA_SWITCH_CLASS}>button`;

/** The colour of the line around the switch and between its buttons. */
const LINE = "color-mix(in srgb,currentColor 30%,transparent)";

/**
 * The line around the switch. Between its buttons, each draws one on its left and top, where the
 * switch clips those of the first in a row and of the first row: side by side when the labels
 * fit, else one above the other, never cut.
 */
const SWITCH_LINE = `1px solid ${LINE}`;

/**
 * The listbox as a column of buttons, on a light page or a dark one: its colours are mixed from
 * the text's own (`currentColor`). Every selector is in `:where()`, so any rule of the page wins;
 * the native `<select>` keeps the browser's look. A heading, the search box and its status, the
 * area switch (a segmented control: two joined buttons, the pressed one filled like a selected
 * entry) and the empty-area status (room only while it says something, wrapping within the
 * list's width rather than widening it) stay in view over entries that scroll; a `display` is set only on what isn't `hidden`, so
 * `hidden` holds. They apply wherever the list is (on the map, beside or under it, in a container
 * of the page's); all of it turns off inside the opt-out (`unstyled.ts`).
 */
export const LIST_STYLES = `
${outsideUnstyled(`.${LISTBOX_CLASS}`)}{padding:.25rem;overflow:auto}
${outsideUnstyled(`.${LIST_CLASS}:not([hidden])`)}{display:flex;flex-direction:column}
${outsideUnstyled(`.${LIST_CLASS}>.${LISTBOX_CLASS}`)}{min-height:0}
${outsideUnstyled(`.${LIST_HEADING_CLASS}`)}{flex:none;padding:.5rem .75rem .25rem;font-weight:600}
${outsideUnstyled(`.${AREA_SWITCH_CLASS}:not([hidden])`)}{display:flex;flex-wrap:wrap;flex:none;margin:.25rem;border:${SWITCH_LINE};border-radius:.375rem;overflow:hidden}
${outsideUnstyled(SWITCH_BUTTON)}{flex:1 1 0;white-space:nowrap;padding:.375rem .5rem;border:0;box-shadow:-1px 0 0 ${LINE},0 -1px 0 ${LINE};background:none;color:inherit;font:inherit;font-weight:600;cursor:pointer}
${outsideUnstyled(`${SWITCH_BUTTON}:hover`)}{background:color-mix(in srgb,currentColor 8%,transparent)}
${outsideUnstyled(`${SWITCH_BUTTON}[aria-pressed=true]`)}{background:color-mix(in srgb,currentColor 16%,transparent)}
${outsideUnstyled(`${SWITCH_BUTTON}:focus-visible`)}{outline:2px solid currentColor;outline-offset:-2px}
${outsideUnstyled(`.${SEARCH_CLASS}`)}{flex:none;box-sizing:border-box;contain:inline-size;margin:.25rem;padding:.375rem .5rem;border:${SWITCH_LINE};border-radius:.375rem;background:none;color:inherit;font:inherit}
@media (pointer:coarse){${outsideUnstyled(`.${SEARCH_CLASS}`)}{font-size:16px}}
${outsideUnstyled(`.${SEARCH_CLASS}:focus-visible`)}{outline:2px solid currentColor;outline-offset:-2px}
${outsideUnstyled(`:is(.${EMPTY_AREA_CLASS},.${SEARCH_STATUS_CLASS}):not(:empty)`)}{flex:none;padding:.5rem 1rem;opacity:.7;contain:inline-size}
${outsideUnstyled(`.${GROUP_CLASS}`)}{padding-top:.25rem}
${outsideUnstyled(`.${HEADING_CLASS}`)}{padding:.5rem .75rem .25rem;font-size:.75rem;letter-spacing:.05em;text-transform:uppercase;opacity:.7}
${outsideUnstyled(ENTRY)}{display:block;padding:.5rem .75rem;border-radius:.375rem;cursor:pointer}
${outsideUnstyled(`${ENTRY}[data-hovered]`)}{background:color-mix(in srgb,currentColor 8%,transparent)}
${outsideUnstyled(`${ENTRY}[data-selected]`)}{background:color-mix(in srgb,currentColor 16%,transparent);font-weight:600}
${outsideUnstyled(`${ENTRY}:focus-visible`)}{outline:2px solid currentColor;outline-offset:-2px}
`;
