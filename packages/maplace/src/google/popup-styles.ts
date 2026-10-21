import { POPUP_CLASS } from "../adapter-kit/popup-content";

/** The class of a popup's heading: its location's title, in the row with Google's close button. */
export const POPUP_HEADING_CLASS = "maplace-popup-heading";

/**
 * Popup content and heading on Google's bubble, which is white whatever the page: dark text and
 * a light scheme, so a dark page's light text, or its form controls, stay readable. Google insets
 * content 12px from the bubble's left and not at all from its right or bottom: the content gets
 * the same inset there, and its first and last child (a paragraph, say, or one inside a single
 * wrapper, as React's portal element) no outer margin of their own. In `:where()`, so any rule
 * of the page wins.
 */
export const POPUP_STYLES = `:where(.${POPUP_CLASS},.${POPUP_HEADING_CLASS}){color:#1f1f1f;color-scheme:light}:where(.${POPUP_CLASS}){padding:0 12px 12px 0}:where(.${POPUP_CLASS}>:first-child,.${POPUP_CLASS}>:only-child>:first-child){margin-top:0}:where(.${POPUP_CLASS}>:last-child,.${POPUP_CLASS}>:only-child>:last-child){margin-bottom:0}`;
