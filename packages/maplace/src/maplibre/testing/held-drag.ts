import type { Map as MapLibreMap } from "maplibre-gl";
import type { LatLng } from "../../geometry";
import { middleOf, type PagePoint, pagePointOf } from "./user-drags";

/** A drag held, not let go until `release`. */
export interface HeldDrag {
  /** Moves the mouse held to where `to` is drawn, over the map. */
  moveTo(to: LatLng): void;
  /** Lets the mouse go where the drag was last moved, over the map. */
  release(): void;
}

/**
 * A press on `element` moved to `to` and held, as MapLibre hears a user's: a press on the marker
 * that bubbles to the map's canvas container, then a move on it. The mouse commands can't hold a
 * press while the test acts in between.
 */
export function holdDrag(map: MapLibreMap, element: Element, to: LatLng): HeldDrag {
  const drag = holdPress(map, element);
  drag.moveTo(to);
  return drag;
}

/** A press on `element` held where it is, not moved yet: MapLibre drags it once it moves. */
export function holdPress(map: MapLibreMap, element: Element): HeldDrag {
  let heldAt = middleOf(element);
  element.dispatchEvent(mouseEvent("mousedown", heldAt));
  const canvas = map.getCanvasContainer();
  return {
    moveTo(to) {
      heldAt = pagePointOf(map, to);
      canvas.dispatchEvent(mouseEvent("mousemove", heldAt));
    },
    release: () => canvas.dispatchEvent(mouseEvent("mouseup", heldAt)),
  };
}

function mouseEvent(type: string, { x, y }: PagePoint): MouseEvent {
  return new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y });
}

/** A finger held on a drag, as the browser would cancel it. */
export interface HeldTouch {
  /** Moves the finger held to where `to` is drawn. */
  moveTo(to: LatLng): void;
  /** The browser cancels the touch where it is. */
  cancel(): void;
}

/**
 * A finger on `element` moved to `to` and held, as MapLibre hears a touch: every event of it on
 * where it began, bubbling to the map's canvas container.
 */
export function holdTouchDrag(map: MapLibreMap, element: Element, to: LatLng): HeldTouch {
  const touchAt = ({ x, y }: PagePoint) =>
    new Touch({ identifier: 1, target: element, clientX: x, clientY: y });
  let touch = touchAt(middleOf(element));
  element.dispatchEvent(touchEvent("touchstart", touch, [touch]));
  const moveTo = (next: LatLng) => {
    touch = touchAt(pagePointOf(map, next));
    element.dispatchEvent(touchEvent("touchmove", touch, [touch]));
  };
  moveTo(to);
  return { moveTo, cancel: () => element.dispatchEvent(touchEvent("touchcancel", touch, [])) };
}

/** A touch event of `touch`, with `down` the fingers still on the page. */
function touchEvent(type: string, touch: Touch, down: Touch[]): TouchEvent {
  return new TouchEvent(type, {
    bubbles: true,
    cancelable: true,
    touches: down,
    targetTouches: down,
    changedTouches: [touch],
  });
}
