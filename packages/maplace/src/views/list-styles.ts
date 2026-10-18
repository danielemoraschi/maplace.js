import { LIST_CLASS, LIST_HEADING_CLASS } from "./headed";
import {
  FIT_ALL_CLASS,
  GROUP_CLASS,
  HEADING_CLASS,
  LISTBOX_CLASS,
  OPTION_CLASS,
} from "./listbox-nodes";

/** Both kinds of entry: a location's option, and "fit all". */
const ENTRY = `:is(.${OPTION_CLASS}, .${FIT_ALL_CLASS})`;

/**
 * The listbox as a column of buttons, on a light page or a dark one: its colours are mixed from
 * the text's own (`currentColor`). Every selector is in `:where()`, so any rule of the page wins;
 * the native `<select>` keeps the browser's look. A heading stays in view over entries that scroll.
 */
export const LIST_STYLES = `
:where(.${LISTBOX_CLASS}) { padding: 0.25rem; overflow: auto; }
:where(.${LIST_CLASS}:not([hidden])) { display: flex; flex-direction: column; }
:where(.${LIST_CLASS} > .${LISTBOX_CLASS}) { min-height: 0; }
:where(.${LIST_HEADING_CLASS}) { flex: none; padding: 0.5rem 0.75rem 0.25rem; font-weight: 600; }
:where(.${GROUP_CLASS}) { padding-top: 0.25rem; }
:where(.${HEADING_CLASS}) { padding: 0.5rem 0.75rem 0.25rem; font-size: 0.75rem; letter-spacing: 0.05em; text-transform: uppercase; opacity: 0.7; }
:where(${ENTRY}) { display: block; padding: 0.5rem 0.75rem; border-radius: 0.375rem; cursor: pointer; }
:where(${ENTRY}[data-hovered]) { background: color-mix(in srgb, currentColor 8%, transparent); }
:where(${ENTRY}[data-selected]) { background: color-mix(in srgb, currentColor 16%, transparent); font-weight: 600; }
:where(${ENTRY}:focus-visible) { outline: 2px solid currentColor; outline-offset: -2px; }
`;
