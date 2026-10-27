import { CONTROL_CLASS, MAPLACE_LISTS, SHARED_CONTROL_STYLES } from "../adapter-kit/control-styles";
import { outsideUnstyled } from "../unstyled";

/** The class of the element a map maplace creates is drawn in: panels stay within its height. */
export const GOOGLE_MAP_CLASS = "maplace-google-map";

const PANEL = `.${CONTROL_CLASS}`;

/**
 * What goes on a Google map sits in a panel like Google's own controls (its shadow, rounding and
 * 10px margin), at 13px whatever the map inherits (Google's 11px), in the map's colour scheme
 * (`data-color-scheme`), never the page's. Within a map maplace creates, maplace's own lists stop
 * short of the map's height by the panel's margins and padding (`cqh`, the map holding a panel
 * being the size container), their entries scrolling; the panel itself clips nothing, so a page's
 * control can draw outside it. Every selector in `:where()`, so any rule of the page wins. The look
 * and the lists' height are kept to Google's panels, each carrying its scheme, so another
 * provider's panels keep theirs on the same page; the form controls' size and the hidden empty
 * panel are every provider's (`adapter-kit/control-styles.ts`).
 */
export const CONTROL_STYLES = `
${outsideUnstyled(`.${GOOGLE_MAP_CLASS}:has(${PANEL})`)}{container-type:size}
${outsideUnstyled(`${PANEL}[data-color-scheme]`)}{margin:10px;padding:4px;border-radius:2px;box-shadow:0 1px 4px -1px #0000004d;background:light-dark(#fff,#444);color:light-dark(#1f1f1f,#e3e3e3);color-scheme:light;font-size:13px}
${outsideUnstyled(`${PANEL}[data-color-scheme=dark]`)}{color-scheme:dark}
${outsideUnstyled(`${PANEL}[data-color-scheme=follow-system]`)}{color-scheme:light dark}
${outsideUnstyled(`${PANEL}[data-color-scheme] ${MAPLACE_LISTS}`)}{box-sizing:border-box;max-height:calc(100cqh - 28px)}
${SHARED_CONTROL_STYLES}`;
