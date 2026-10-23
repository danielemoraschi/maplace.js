import { POPUP_HEADING_CLASS } from "../adapter-kit/popup-content";
import { POPUP_TEXT_RULE } from "../adapter-kit/popup-text";
import { outsideUnstyled } from "../unstyled";

/**
 * Popup content on MapLibre's bubble, its text as on every provider's (`popup-text.ts`); the
 * heading on its own line above the content, clear of the close button. In `:where()`, so any rule
 * of the page wins; all of it off inside the opt-out (`unstyled.ts`).
 */
export const POPUP_STYLES =
  POPUP_TEXT_RULE +
  outsideUnstyled(`.${POPUP_HEADING_CLASS}`) +
  "{display:block;margin:0 1.25rem .25rem 0;font-weight:600}";
