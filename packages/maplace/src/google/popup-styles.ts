import { POPUP_CLASS, POPUP_HEADING_CLASS } from "../adapter-kit/popup-content";
import { POPUP_LINKS_RULE } from "../adapter-kit/popup-links";
import { POPUP_TEXT_RULE } from "../adapter-kit/popup-text";
import { outsideUnstyled } from "../unstyled";

/**
 * Marks the content Google's bubble holds, so these rules reach no other provider's popup: maplace's
 * own mark, as Google's class names for its bubble are not an API (MapLibre's are, and its rules
 * use them).
 */
export const GOOGLE_POPUP_ATTRIBUTE = "data-maplace-google";

const CONTENT = `.${POPUP_CLASS}[${GOOGLE_POPUP_ATTRIBUTE}]`;
const HEADING = `.${POPUP_HEADING_CLASS}[${GOOGLE_POPUP_ATTRIBUTE}]`;
const FIRST_CHILD = `${CONTENT}>:first-child,${CONTENT}>:first-child>:first-child`;
const LAST_CHILD = `${CONTENT}>:last-child,${CONTENT}>:only-child>:last-child`;

/**
 * Set on the content and heading once Google's bubble shows them (`popup-gutter.ts`): the room its
 * scrollbars take at the inline end and below. Internal, as is `--maplace-inset`: no API.
 */
export const INLINE_GUTTER_PROPERTY = "--maplace-gutter-inline";
export const BLOCK_GUTTER_PROPERTY = "--maplace-gutter-block";
const INLINE_GUTTER = `var(${INLINE_GUTTER_PROPERTY},0px)`;
const BLOCK_GUTTER = `var(${BLOCK_GUTTER_PROPERTY},0px)`;
const INSET = "var(--maplace-inset)";

/**
 * Popup content on Google's bubble, marked as Google's (`popup-window.ts`), its text as on every
 * provider's (`popup-text.ts`). Google insets content and heading 12px from the bubble's inline
 * start and keeps room for its scrollbars at the inline end and below, measured as the gutter
 * properties (18px and 12px where the browser honours Google's scrollbar styling, the browser's own
 * where they take room, none with overlay scrollbars): the content pads each side and the bottom,
 * and the heading its start, up to the largest of them, so all match. Its first and last
 * child (a paragraph, say, or one inside a wrapper, as React's portal element, the last only with
 * no links' row after it) keep no outer margin of their own. In `:where()`, so any rule of the page
 * wins; all of it off inside the opt-out (`unstyled.ts`).
 */
export const POPUP_STYLES =
  POPUP_TEXT_RULE +
  outsideUnstyled(`${CONTENT},${HEADING}`) +
  `{--maplace-inset:max(12px,${INLINE_GUTTER},${BLOCK_GUTTER})}` +
  outsideUnstyled(CONTENT) +
  `{padding-block:0 calc(${INSET} - ${BLOCK_GUTTER});padding-inline:calc(${INSET} - 12px) calc(${INSET} - ${INLINE_GUTTER})}` +
  outsideUnstyled(HEADING) +
  `{padding-inline-start:calc(${INSET} - 12px)}` +
  outsideUnstyled(FIRST_CHILD) +
  "{margin-top:0}" +
  outsideUnstyled(LAST_CHILD) +
  "{margin-bottom:0}" +
  // Last: beside text alone the row is the first child, and keeps its gap.
  POPUP_LINKS_RULE;
