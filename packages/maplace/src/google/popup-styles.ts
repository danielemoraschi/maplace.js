import { POPUP_CLASS } from "../adapter-kit/popup-content";
import { POPUP_TEXT_RULE } from "../adapter-kit/popup-text";
import { outsideUnstyled } from "../unstyled";

/**
 * Marks the content Google's bubble holds, so these rules reach no other provider's popup: maplace's
 * own mark, as Google's class names for its bubble are not an API (MapLibre's are, and its rules
 * use them).
 */
export const GOOGLE_POPUP_ATTRIBUTE = "data-maplace-google";

const CONTENT = `.${POPUP_CLASS}[${GOOGLE_POPUP_ATTRIBUTE}]`;
const FIRST_CHILD = `${CONTENT}>:first-child,${CONTENT}>:only-child>:first-child`;
const LAST_CHILD = `${CONTENT}>:last-child,${CONTENT}>:only-child>:last-child`;

/**
 * Popup content on Google's bubble, marked as Google's (`popup-window.ts`), its text as on every
 * provider's (`popup-text.ts`). Google insets content 12px from the bubble's left and not at all
 * from its right or bottom: the content gets the same inset there, and its first and last child (a
 * paragraph, say, or one inside a single wrapper, as React's portal element) no outer margin of
 * their own. In `:where()`, so any rule of the page wins; all of it off inside the opt-out
 * (`unstyled.ts`).
 */
export const POPUP_STYLES =
  POPUP_TEXT_RULE +
  outsideUnstyled(CONTENT) +
  "{padding:0 12px 12px 0}" +
  outsideUnstyled(FIRST_CHILD) +
  "{margin-top:0}" +
  outsideUnstyled(LAST_CHILD) +
  "{margin-bottom:0}";
