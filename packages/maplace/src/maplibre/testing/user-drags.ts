import type { Map as MapLibreMap } from "maplibre-gl";
import type { LatLng } from "../../geometry";

/** A point in the test page's viewport, in CSS pixels, as the mouse commands take it. */
export interface PagePoint {
  readonly x: number;
  readonly y: number;
}

/** Where `at` is drawn on the test page. */
export function pagePointOf(map: MapLibreMap, at: LatLng): PagePoint {
  const box = map.getContainer().getBoundingClientRect();
  const { x, y } = map.project([at.lng, at.lat]);
  return { x: box.left + x, y: box.top + y };
}

/** The middle of a pin's round head, where a user grabs it: as far below its top as it is wide. */
export function pinHeadOf(icon: Element): PagePoint {
  const box = icon.getBoundingClientRect();
  return { x: box.left + box.width / 2, y: box.top + box.width / 2 };
}
