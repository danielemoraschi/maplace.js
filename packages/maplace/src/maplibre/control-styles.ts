import { outsideUnstyled } from "../unstyled";

/**
 * The class of the element holding each control on a MapLibre map: the control's panel, named as
 * on a Google map, so a page's rule reaches both.
 */
export const CONTROL_CLASS = "maplace-control";

/** The class of the element a map maplace creates is drawn in: panels stay within its height. */
export const MAPLIBRE_MAP_CLASS = "maplace-maplibre-map";

const PANEL = `.maplibregl-ctrl.${CONTROL_CLASS}`;

/**
 * What goes on a MapLibre map sits in a panel like MapLibre's own controls: their 4px rounding and
 * 2px ring (`.maplibregl-ctrl-group`), the margins of MapLibre's corners (its own stylesheet's,
 * kept inside the opt-out too). Everything else is as on a Google map (`google/control-styles.ts`):
 * 13px whatever the map inherits (MapLibre's 12px), light whatever the page's scheme, as MapLibre's
 * controls are. Within a map maplace creates, maplace's own lists stop short of the map's height
 * by the panel's margins and padding (`cqh`, the map holding a panel being the size container;
 * never the page's own map, which size containment would change); in the bottom-right corner
 * they also leave room for MapLibre's attribution, one line of it (24px and its 10px margins). An
 * empty list hides it, inside the opt-out (`unstyled.ts`) too, where the rest is off. Every
 * selector in `:where()`, so any rule of the page wins, and naming MapLibre's control class, so it
 * never reaches another provider's panels.
 */
export const CONTROL_STYLES = `
${outsideUnstyled(`.${MAPLIBRE_MAP_CLASS}:has(${PANEL})`)}{container-type:size}
${outsideUnstyled(PANEL)}{padding:4px;border-radius:4px;box-shadow:0 0 0 2px rgba(0,0,0,.1);background:light-dark(#fff,#444);color:light-dark(#1f1f1f,#e3e3e3);color-scheme:light;font-size:13px}
:where(${PANEL}:has(>[hidden]:only-child)){display:none}
${outsideUnstyled(`${PANEL} :is(.maplace-list,.maplace-listbox)`)}{box-sizing:border-box;max-height:calc(100cqh - 28px)}
${outsideUnstyled(`.maplibregl-ctrl-bottom-right>${PANEL} :is(.maplace-list,.maplace-listbox)`)}{max-height:calc(100cqh - 72px)}
${outsideUnstyled(`${PANEL} :is(select,input,button)`)}{font:inherit}
${outsideUnstyled(`${PANEL} select`)}{min-height:2.25em}
${outsideUnstyled(`${PANEL} :is([type=radio],[type=checkbox])`)}{width:1.15em;height:1.15em;margin:.4em}
`;
