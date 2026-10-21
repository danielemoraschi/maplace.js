import type { MapPart } from "./mounted-map";

/**
 * Keeps maplace's DOM markers and front pins, stacked by rank, among themselves: the map's canvas
 * container is made a stacking context, so a rank never lifts a marker over the popup (after it,
 * in the map's container), the map's controls or the page's overlays. Put back on destroy, as a
 * page's own map was.
 */
export const markerStacking: MapPart = {
  open({ map, onDestroy }) {
    const container = map.getCanvasContainer();
    const before = container.style.isolation;
    container.style.isolation = "isolate";
    onDestroy(() => {
      container.style.isolation = before;
    });
  },
};
