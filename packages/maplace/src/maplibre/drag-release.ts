import type { Marker } from "maplibre-gl";
import type { MountedMapLibre } from "./mounted-map";
import { isInCanvasContainer } from "./pointer-targets";

/** The press a user holds on a draggable marker, which the page may end before the user does. */
export interface MarkerPress {
  /** The mouse button or the finger pressed on the marker is still down. */
  isHeld(): boolean;
  /** Ends the press held, if any, as MapLibre's own release: its drag ends where the marker is. */
  release(): void;
}

/** A press held: ended where MapLibre heard it, or released by firing what MapLibre missed. */
interface HeldPress {
  readonly signal: AbortSignal;
  end(): void;
  release(): void;
}

/**
 * Follows each press on `marker`, returning the one held now, and ends its drag where the user or
 * the browser ended it though MapLibre heard no end: the mouse let go outside the map's canvas or
 * the window losing focus with the button down, a touch the browser cancelled, or a touch whose node
 * the page took off the map (its moves are fired too). MapLibre ends a drag only on the map's
 * own `mouseup` or `touchend`, so the end is fired as one, where the pointer last was (a page's
 * listener on its map hears it too, as it would a release over the map). Each press's listeners go
 * at its end, or with the map.
 */
export function endDragsTheMapMisses(marker: Marker, mounted: MountedMapLibre): MarkerPress {
  const { map, maplibre, closing } = mounted;
  const element = marker.getElement();
  const view = map.getContainer().ownerDocument.defaultView;
  let held: HeldPress | undefined;
  element.addEventListener("mousedown", (event) => {
    if (marker.isDraggable()) holdMouse(event);
  });
  element.addEventListener(
    "touchstart",
    (event) => {
      if (marker.isDraggable()) holdTouch(event);
    },
    { passive: true },
  );

  /** A press begun, its release on the map `fire`: fired unless the marker was taken off. */
  function begin(fire: () => void): HeldPress {
    held?.end();
    const ending = new AbortController();
    const press: HeldPress = {
      signal: AbortSignal.any([closing, ending.signal]),
      end() {
        ending.abort();
        if (held === press) held = undefined;
      },
      release() {
        press.end();
        if (element.isConnected) fire();
      },
    };
    held = press;
    return press;
  }

  /** A mouse press: let go over the canvas, MapLibre hears it; elsewhere, or on a blur, it is fired. */
  function holdMouse(down: MouseEvent): void {
    let last = down;
    const press = begin(() =>
      map.fire(new maplibre.MapMouseEvent("mouseup", map, asRelease(last))),
    );
    const { signal } = press;
    const moved = (event: MouseEvent) => {
      last = event;
    };
    const released = (event: MouseEvent) => {
      last = event;
      if (isInCanvasContainer(event, map)) press.end();
      else press.release();
    };
    view?.addEventListener("mousemove", moved, { capture: true, signal });
    view?.addEventListener("mouseup", released, { capture: true, signal });
    // Not capturing: an element's own blur doesn't bubble, so only the window's is heard.
    view?.addEventListener("blur", press.release, { signal });
  }

  /**
   * A touch: every event of it goes to the node it began on, even once the page's icon, rebuilt,
   * took that node out of the map, where MapLibre no longer hears it: its moves and its end are
   * then fired on the map. One the browser cancels is fired as its end, with the touches cancelled
   * where they were.
   */
  function holdTouch(start: TouchEvent): void {
    const touched = start.composedPath()[0] as HTMLElement;
    let last = start;
    const press = begin(() => map.fire(new maplibre.MapTouchEvent("touchend", map, last)));
    const listening = { capture: true, passive: true, signal: press.signal };
    const isMissed = (event: TouchEvent) => element.isConnected && !isInCanvasContainer(event, map);
    const moved = (event: TouchEvent) => {
      last = event;
      if (isMissed(event)) map.fire(new maplibre.MapTouchEvent("touchmove", map, event));
    };
    const ended = (event: TouchEvent) => {
      last = event;
      if (event.type === "touchcancel" || isMissed(event)) press.release();
      else press.end();
    };
    touched.addEventListener("touchmove", moved, listening);
    touched.addEventListener("touchend", ended, listening);
    touched.addEventListener("touchcancel", ended, listening);
  }

  return { isHeld: () => held !== undefined, release: () => held?.release() };
}

/**
 * `event` as the map's release: itself when it is one (let go outside the map), else one made
 * where it was and dispatched nowhere, so nothing takes it for a place on the map.
 */
function asRelease(event: MouseEvent): MouseEvent {
  return event.type === "mouseup" ? event : new MouseEvent("mouseup", event);
}
