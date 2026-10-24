/// <reference types="google.maps" preserve="true" />
import { shiftClear } from "../adapter-kit/popup-shift";
import { frames } from "./frames";
import { measureCorners } from "./popup-corners";

/** A press, a touch or the wheel on the map: a user's gesture, which a pan would cut short. */
const GESTURE_STARTS = ["pointerdown", "wheel"] as const;

/** What tells the camera moved: Google fires one of these for every move, and `idle` after. */
const MOVES = ["center_changed", "zoom_changed", "bounds_changed"] as const;

/**
 * Frames within which a move asked for shows its first change (Maps JS 3.66,
 * `testing/camera-watch.ts`): after them with none, nothing is pending.
 */
const FRAMES_FOR_A_MOVE_TO_SHOW = 2;

/** A click popup's pan clear of what the map's corners show, once the map settles. */
export interface PopupPan {
  /**
   * Pans the window's popup clear once the map has settled after the window drew it: two frames
   * after `domready` when nothing is moving, else at the `idle` that ends the move under way (the
   * selection's `panTo` or jump, Google's autopan), by the content the window shows then, refreshed
   * or not, once it is in the page. Once, unless the user takes the map first. A pan still waiting
   * for an earlier popup is dropped.
   */
  panWhenSettled(): void;
  /** Nothing waits to pan any more: the window closed. */
  stop(): void;
}

/**
 * Pans as MapLibre's popup does (`maplibre/popup-pan.ts`), after Google's InfoWindow's own autopan,
 * which keeps the popup inside the map only: by the least that puts its bubble clear of every
 * control by MARGIN. With no such place, Google's own pan stands: its logo and terms are never
 * covered. Never once the user presses, touches or scrolls the map after the popup opened (W34:
 * a pan then cuts their gesture short), and never for a move after the one the popup opened with,
 * so where the user or the page takes the map later, it stays.
 */
export function createPopupPan(map: google.maps.Map, infoWindow: google.maps.InfoWindow): PopupPan {
  const mapDiv = map.getDiv();
  let endWait = () => {};

  function panWhenSettled(): void {
    endWait();
    let moving = map.getBounds() === undefined;
    let looked = false;
    const waiting = new AbortController();
    /**
     * Decides once the window's content is in the page: until then, its next look or `idle` will
     * (content Google never puts in the page keeps the wait until the window closes or opens
     * again).
     */
    const decide = () => {
      const content = contentInPage(infoWindow);
      if (content === undefined) return;
      end();
      panClear(map, content);
    };
    const listeners = [
      ...MOVES.map((name) =>
        map.addListener(name, () => {
          moving = true;
        }),
      ),
      map.addListener("idle", () => {
        moving = false;
        if (looked) decide();
      }),
      infoWindow.addListener("domready", () => {
        void frames(FRAMES_FOR_A_MOVE_TO_SHOW).then(() => {
          if (waiting.signal.aborted) return;
          looked = true;
          if (!moving) decide();
        });
      }),
    ];
    function end(): void {
      waiting.abort();
      for (const listener of listeners) listener.remove();
      endWait = () => {};
    }
    for (const input of GESTURE_STARTS)
      mapDiv.addEventListener(input, end, {
        capture: true,
        passive: true,
        signal: waiting.signal,
      });
    endWait = end;
  }

  return { panWhenSettled, stop: () => endWait() };
}

/** The content `infoWindow` shows, once Google has put it in the page. */
function contentInPage(infoWindow: google.maps.InfoWindow): Element | undefined {
  const content = infoWindow.getContent();
  return content instanceof Element && content.isConnected ? content : undefined;
}

/** Pans `map` by the least that brings the popup showing `content` clear of every control. */
function panClear(map: google.maps.Map, content: Element): void {
  const bubble = content.closest('[role="dialog"]') ?? content;
  const { room, controls } = measureCorners(map, bubble);
  const shift = shiftClear(bubble.getBoundingClientRect(), room, controls);
  if (shift !== undefined && (shift[0] !== 0 || shift[1] !== 0)) map.panBy(...shift);
}
