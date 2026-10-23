import { outsideUnstyled } from "../unstyled";
import { POPUP_CLASS, POPUP_HEADING_CLASS } from "./popup-content";

/**
 * A popup's content and heading on the provider's bubble, white whatever the page: dark text and
 * a light scheme, so a dark page's light text, or its form controls, stay readable. In
 * `:where()`, so any rule of the page wins; off inside the opt-out (`unstyled.ts`).
 */
export const POPUP_TEXT_RULE = `${outsideUnstyled(`.${POPUP_CLASS},.${POPUP_HEADING_CLASS}`)}{color:#1f1f1f;color-scheme:light}`;
