import { POPUP_CLASS } from "../adapter-kit/popup-content";

/**
 * Popup content on Google's bubble, which is white whatever the page: dark text and a light
 * scheme, so content that inherits a dark page's light text, or its form controls, stays
 * readable. In `:where()`, so any rule of the page wins.
 */
export const POPUP_STYLES = `:where(.${POPUP_CLASS}) { color: #1f1f1f; color-scheme: light; }`;
