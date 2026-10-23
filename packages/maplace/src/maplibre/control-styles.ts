import { outsideUnstyled } from "../unstyled";

/**
 * The class of the element holding each control on a MapLibre map: the control's panel, named as
 * on a Google map, so a page's rule reaches both.
 */
export const CONTROL_CLASS = "maplace-control";

/** The class of the element a map maplace creates is drawn in. */
export const MAPLIBRE_MAP_CLASS = "maplace-maplibre-map";

/** A maplace panel on a MapLibre map: styled here, and looked for in the corners when measured. */
export const PANEL_SELECTOR = `.maplibregl-ctrl.${CONTROL_CLASS}`;

/** maplace's own lists, whose height the corners' layout limits (`corner-watch.ts`). */
export const MAPLACE_LISTS = ":is(.maplace-list,.maplace-listbox)";

/** The height each maplace list in a corner may take, set on the corner by `corner-watch.ts`. */
export const LIST_ROOM_PROPERTY = "--maplace-list-room";

/** How far the bottom-left corner sits up, set on it by `corner-watch.ts`. */
export const LIFT_PROPERTY = "--maplace-bottom-left-lift";

/**
 * What goes on a MapLibre map sits in a panel like MapLibre's own controls: their 4px rounding and
 * 2px ring (`.maplibregl-ctrl-group`), the margins of MapLibre's corners (its own stylesheet's,
 * kept inside the opt-out too). Everything else is as on a Google map (`google/control-styles.ts`):
 * 13px whatever the map inherits (MapLibre's 12px), light whatever the page's scheme, as MapLibre's
 * controls are. maplace's own lists take the height measured for them on the map
 * (`corner-watch.ts`, a map maplace creates or the page's own): each stops 10px short of what the
 * corners below it hold, MapLibre's attribution included, lists sharing a column of the map share
 * its height, and the bottom-left corner holding a panel sits above what the bottom-right holds in
 * its column (a phone's attribution), as its margin, so the page's controls there rise with it. An
 * empty list hides it, inside the opt-out (`unstyled.ts`) too, where the rest is off. Every
 * selector in `:where()`, so any rule of the page wins, and naming MapLibre's control class, so it
 * never reaches another provider's panels.
 */
export const CONTROL_STYLES = `
${outsideUnstyled(PANEL_SELECTOR)}{padding:4px;border-radius:4px;box-shadow:0 0 0 2px rgba(0,0,0,.1);background:light-dark(#fff,#444);color:light-dark(#1f1f1f,#e3e3e3);color-scheme:light;font-size:13px}
:where(${PANEL_SELECTOR}:has(>[hidden]:only-child)){display:none}
${outsideUnstyled(`${PANEL_SELECTOR} ${MAPLACE_LISTS}`)}{box-sizing:border-box;max-height:var(${LIST_ROOM_PROPERTY})}
${outsideUnstyled(`.maplibregl-ctrl-bottom-left:has(>${PANEL_SELECTOR})`)}{margin-bottom:var(${LIFT_PROPERTY})}
${outsideUnstyled(`${PANEL_SELECTOR} :is(select,input,button)`)}{font:inherit}
${outsideUnstyled(`${PANEL_SELECTOR} select`)}{min-height:2.25em}
${outsideUnstyled(`${PANEL_SELECTOR} :is([type=radio],[type=checkbox])`)}{width:1.15em;height:1.15em;margin:.4em}
`;
