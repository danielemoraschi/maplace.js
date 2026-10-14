/// <reference types="google.maps" />
import { onTestFailed, onTestFinished } from "vitest";

/** What shows what Google did with the camera, and when its moves ended. */
const CAMERA_EVENTS = ["center_changed", "zoom_changed", "idle"] as const;

/**
 * Records Google's camera events on `map` from now until the test ends and, if it fails, prints
 * them with their times and zooms, so a check that only fails on a busy CI runner says in its
 * log what Google did.
 */
export function explainCameraOnFailure(map: google.maps.Map): void {
  const started = performance.now();
  const events: string[] = [];
  const listeners = CAMERA_EVENTS.map((name) =>
    map.addListener(name, () => {
      events.push(
        `${name} at ${Math.round(performance.now() - started)} ms, zoom ${map.getZoom()}`,
      );
    }),
  );
  onTestFailed(() => console.error(`Google's camera: ${events.join("; ")}`));
  onTestFinished(() => {
    for (const listener of listeners) listener.remove();
  });
}
