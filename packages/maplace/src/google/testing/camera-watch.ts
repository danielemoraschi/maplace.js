/// <reference types="google.maps" />
import { frames, idle } from "./map-waits";

/** The probe's view of a Google map's camera. */
export interface CameraWatch {
  /** Resolves once the camera is still: at once when nothing moved, else at Google's `idle`. */
  settled(): Promise<void>;
  stop(): void;
}

/** What tells the camera moved: Google fires one of these for every move, and `idle` after. */
const MOVES = ["center_changed", "zoom_changed", "bounds_changed"] as const;

/**
 * Watches `map` from Google's own events, so the adapter keeps no state for its tests. Measured on
 * Maps JS 3.66: a move to where the camera already is fires nothing and no `idle`, and every other
 * move fires a change within a frame (`panTo`'s first `bounds_changed` comes in the next one), so
 * two frames without one mean nothing is pending. A map not drawn yet is moving: its first `idle`
 * is to come. Listeners added before the adapter's run first, and `settled` resolves in a
 * microtask after Google's listener loop, so whatever the adapter reports at `idle` is in by then.
 */
export function watchCamera(map: google.maps.Map): CameraWatch {
  let moving = map.getBounds() === undefined;
  const listeners = [
    ...MOVES.map((name) => map.addListener(name, () => (moving = true))),
    map.addListener("idle", () => (moving = false)),
  ];
  return {
    async settled() {
      await frames(2);
      while (moving) await idle(map);
    },
    stop() {
      for (const listener of listeners) listener.remove();
    },
  };
}
