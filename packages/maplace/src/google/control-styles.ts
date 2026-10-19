/** The class of the element holding each control on a Google map: the control's panel. */
export const CONTROL_CLASS = "maplace-control";
/** The class of the element a map maplace creates is drawn in: panels stay within its height. */
export const GOOGLE_MAP_CLASS = "maplace-google-map";

const PANEL = `.${CONTROL_CLASS}`;

/**
 * What goes on a Google map sits in a panel like Google's own controls (its shadow, rounding and
 * 10px margin), at 13px whatever the map inherits (Google's 11px), form controls at that size with
 * room to tap, in the map's colour scheme (`data-color-scheme`), never the page's. Within a map
 * maplace creates, maplace's own lists stop short of the map's height by the panel's margins and
 * padding (`cqh`, the map holding a panel being the size container), their entries scrolling; the
 * panel itself clips nothing, so a page's control can draw outside it. An empty list hides it. Every selector in `:where()`, so any rule of the page wins.
 */
export const CONTROL_STYLES = `
:where(.${GOOGLE_MAP_CLASS}:has(${PANEL})){container-type:size}
:where(${PANEL}){margin:10px;padding:4px;border-radius:2px;box-shadow:0 1px 4px -1px #0000004d;background:light-dark(#fff,#444);color:light-dark(#1f1f1f,#e3e3e3);color-scheme:light;font-size:13px}
:where(${PANEL}[data-color-scheme=dark]){color-scheme:dark}
:where(${PANEL}[data-color-scheme=follow-system]){color-scheme:light dark}
:where(${PANEL}:has(>[hidden]:only-child)){display:none}
:where(${PANEL} :is(.maplace-list,.maplace-listbox)){box-sizing:border-box;max-height:calc(100cqh - 28px)}
:where(${PANEL} :is(select,input,button)){font:inherit}
:where(${PANEL} select){min-height:2.25em}
:where(${PANEL} :is([type=radio],[type=checkbox])){width:1.15em;height:1.15em;margin:.4em}
`;
