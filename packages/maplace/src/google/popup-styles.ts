import { POPUP_CLASS } from "../adapter-kit/popup-content";
import { outsideUnstyled } from "../unstyled";

/** The class of a popup's heading: its location's title, in the row with Google's close button. */
export const POPUP_HEADING_CLASS = "maplace-popup-heading";

const CONTENT = `.${POPUP_CLASS}`;
const TEXT = `${CONTENT},.${POPUP_HEADING_CLASS}`;
const FIRST_CHILD = `${CONTENT}>:first-child,${CONTENT}>:only-child>:first-child`;
const LAST_CHILD = `${CONTENT}>:last-child,${CONTENT}>:only-child>:last-child`;

/**
 * Popup content and heading on Google's bubble, which is white whatever the page: dark text and
 * a light scheme, so a dark page's light text, or its form controls, stay readable. Google insets
 * content 12px from the bubble's left and not at all from its right or bottom: the content gets
 * the same inset there, and its first and last child (a paragraph, say, or one inside a single
 * wrapper, as React's portal element) no outer margin of their own. In `:where()`, so any rule
 * of the page wins; all of it off inside the opt-out (`unstyled.ts`).
 */
export const POPUP_STYLES =
  outsideUnstyled(TEXT) +
  "{color:#1f1f1f;color-scheme:light}" +
  outsideUnstyled(CONTENT) +
  "{padding:0 12px 12px 0}" +
  outsideUnstyled(FIRST_CHILD) +
  "{margin-top:0}" +
  outsideUnstyled(LAST_CHILD) +
  "{margin-bottom:0}";
