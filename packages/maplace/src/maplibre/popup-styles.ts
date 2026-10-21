import { POPUP_HEADING_CLASS } from "../adapter-kit/popup-content";
import { outsideUnstyled } from "../unstyled";

/**
 * A popup's heading on MapLibre's bubble, white whatever the page: its own line above the content,
 * clear of the close button, in dark text. In `:where()`, so any rule of the page wins; off inside
 * the opt-out (`unstyled.ts`).
 */
export const POPUP_STYLES =
  outsideUnstyled(`.${POPUP_HEADING_CLASS}`) +
  "{display:block;margin:0 1.25rem .25rem 0;font-weight:600;color:#1f1f1f}";
