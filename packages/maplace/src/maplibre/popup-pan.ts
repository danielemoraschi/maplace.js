import type { Map as MapLibreMap, Popup } from "maplibre-gl";

/** Space kept between a popup panned into view and the map's edge, as Google keeps. */
const MARGIN = 16;

/**
 * Pans the map so the popup is inside it, as Google's InfoWindow pans when it opens: by as little
 * as it takes, its top and left edges first when it is larger than the map.
 */
export function panIntoView(map: MapLibreMap, popup: Popup): void {
  const element = popup.getElement();
  if (element === undefined) return;
  const mapBox = map.getContainer().getBoundingClientRect();
  const box = element.getBoundingClientRect();
  const dx = shiftInto(box.left, box.right, mapBox.left, mapBox.right);
  const dy = shiftInto(box.top, box.bottom, mapBox.top, mapBox.bottom);
  if (dx !== 0 || dy !== 0) map.panBy([dx, dy]);
}

/** How far to move the view along one axis so `[start, end]` sits inside `[min, max]`. */
function shiftInto(start: number, end: number, min: number, max: number): number {
  if (start < min + MARGIN) return start - min - MARGIN;
  if (end > max - MARGIN) return Math.min(end - max + MARGIN, start - min - MARGIN);
  return 0;
}
