import { POPUP_CLASS, POPUP_HEADING_CLASS } from "../adapter-kit/popup-content";
import { outsideUnstyled } from "../unstyled";

const TEXT = `.${POPUP_CLASS},.${POPUP_HEADING_CLASS}`;

/**
 * Popup content and heading on MapLibre's bubble, white whatever the page: dark text and a light
 * scheme, as on Google, so a dark page's light text, or its form controls, stay readable; the
 * heading on its own line above the content, clear of the close button. In `:where()`, so any rule
 * of the page wins; all of it off inside the opt-out (`unstyled.ts`).
 */
export const POPUP_STYLES =
  outsideUnstyled(TEXT) +
  "{color:#1f1f1f;color-scheme:light}" +
  outsideUnstyled(`.${POPUP_HEADING_CLASS}`) +
  "{display:block;margin:0 1.25rem .25rem 0;font-weight:600}";
