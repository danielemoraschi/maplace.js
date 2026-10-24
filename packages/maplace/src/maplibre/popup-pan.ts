import type { Map as MapLibreMap, Popup } from "maplibre-gl";
import { panShift, type ShownControl } from "../adapter-kit/popup-shift";
import { cornerElementsIn } from "./corner-measure";

/**
 * MapLibre's attribution, which a popup may cover when nothing else leaves it room: on a phone it
 * shows open, two lines tall, until the user first drags the map.
 */
const ATTRIBUTION_CLASS = "maplibregl-ctrl-attrib";

/**
 * Pans the map so the popup is inside it and clear of what its corners show (maplace's panels,
 * MapLibre's and the page's controls), as Google's InfoWindow pans when it opens: by as little as
 * it takes; with no such place, clear of all but MapLibre's attribution, and with none either,
 * inside the map only, its top and left edges first when it is larger than the map. A hidden map
 * isn't panned. After any move under way: a selection pans the map to its location
 * (`camera-moves.ts`) in the same pass that opened the popup, and a pan of the popup's own would
 * cut that short.
 */
export function panIntoView(map: MapLibreMap, popup: Popup): void {
  queueMicrotask(() => {
    if (map.isMoving()) panAfterMove(map, popup);
    else panClear(map, popup);
  });
}

/**
 * Pans a frame after the move under way ends, unless the map moves again by then or the user
 * holds it: a press or touch on the map ends the move at once, often frames before MapLibre counts
 * the gesture as moving, and a pan then would cancel the gesture itself. Where the user takes the
 * map, it stays; a later selection's pan, which ends this one, runs its course.
 */
function panAfterMove(map: MapLibreMap, popup: Popup): void {
  map.once("moveend", () => {
    requestAnimationFrame(() => {
      if (!map.isMoving() && !isHeldByUser(map)) panClear(map, popup);
    });
  });
}

/** Whether a gesture of the user's holds the map: a press or touch, or a wheel's zoom under way. */
function isHeldByUser(map: MapLibreMap): boolean {
  return [map.dragPan, map.dragRotate, map.touchZoomRotate, map.scrollZoom].some((gesture) =>
    gesture.isActive(),
  );
}

function panClear(map: MapLibreMap, popup: Popup): void {
  const element = popup.getElement();
  if (!popup.isOpen() || element === undefined) return;
  const container = map.getContainer();
  const room = container.getBoundingClientRect();
  const shift = panShift(element.getBoundingClientRect(), room, controlsIn(container));
  if (shift !== undefined && (shift[0] !== 0 || shift[1] !== 0)) map.panBy([...shift]);
}

/** What MapLibre's four corners show: panels and controls, whoever put them there. */
function controlsIn(container: HTMLElement): ShownControl[] {
  const corners = cornerElementsIn(container);
  if (corners === undefined) return [];
  return Object.values(corners)
    .flatMap((corner) => Array.from(corner.children))
    .map((control) => ({
      box: control.getBoundingClientRect(),
      coverable: control.classList.contains(ATTRIBUTION_CLASS),
    }))
    .filter(({ box }) => box.width > 0 && box.height > 0);
}
