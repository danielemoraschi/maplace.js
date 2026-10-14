/// <reference types="google.maps" />
import { frames } from "../frames";
import { idle } from "./map-waits";

/** The probe's view of a Google map's camera. */
export interface CameraWatch {
  /** Resolves once the camera is still: at once when nothing moved, else at Google's `idle`. */
  settled(): Promise<void>;
  stop(): void;
}

/** What tells the camera moved: Google fires one of these for every move, and `idle` after. */
const MOVES = ["center_changed", "zoom_changed", "bounds_changed"] as const;

/** Enough for the adapter's longest wait after a resize, and its move's first change event. */
const FRAMES_AFTER_RESIZE = 6;

/**
 * Watches `map` from Google's own events, so the adapter keeps no state for its tests. Measured on
 * Maps JS 3.66: a move to where the camera already is fires nothing and no `idle`, and every other
 * move fires a change within a frame (`panTo`'s first `bounds_changed` comes in the next one), so
 * two frames without one mean nothing is pending. A map not drawn yet is moving: its first `idle`
 * is to come. Listeners added before the adapter's run first, and `settled` resolves in a
 * microtask after Google's listener loop, so whatever the adapter reports at `idle` is in by then.
 * After a resize the adapter needs a few frames before it moves (`map-resizes.ts`: a frame for
 * Google to take the size in, three for a map shown again), so a resize seen waits those out.
 */
export function watchCamera(map: google.maps.Map): CameraWatch {
  let moving = map.getBounds() === undefined;
  let resized = false;
  const listeners = [
    ...MOVES.map((name) => map.addListener(name, () => (moving = true))),
    map.addListener("idle", () => (moving = false)),
  ];
  const sizes = new ResizeObserver(() => (resized = true));
  sizes.observe(map.getDiv());
  return {
    async settled() {
      // By the next frame, the size observers have heard of a resize the test just made.
      await frames(1);
      await frames(resized ? FRAMES_AFTER_RESIZE : 1);
      resized = false;
      while (moving) await idle(map);
    },
    stop() {
      for (const listener of listeners) listener.remove();
      sizes.disconnect();
    },
  };
}
