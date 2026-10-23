import type { Map as MapLibreMap } from "maplibre-gl";
import type { LatLng } from "../../geometry";
import { pagePointOf } from "./user-drags";

/** A drag held, not let go until `release`. */
export interface HeldDrag {
  /** Lets the mouse go where the drag is held, over the map. */
  release(): void;
}

/**
 * A press on `element` moved to `to` and held, as MapLibre hears a user's: a press on the marker
 * that bubbles to the map's canvas container, then a move on it. The mouse commands can't hold a
 * press while the test acts in between.
 */
export function holdDrag(map: MapLibreMap, element: Element, to: LatLng): HeldDrag {
  const box = element.getBoundingClientRect();
  const pressAt = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  element.dispatchEvent(mouseEvent("mousedown", pressAt));
  const heldAt = pagePointOf(map, to);
  const canvas = map.getCanvasContainer();
  canvas.dispatchEvent(mouseEvent("mousemove", heldAt));
  return { release: () => canvas.dispatchEvent(mouseEvent("mouseup", heldAt)) };
}

function mouseEvent(type: string, { x, y }: { x: number; y: number }): MouseEvent {
  return new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y });
}
