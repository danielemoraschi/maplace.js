/// <reference types="google.maps" />
import type { LatLng } from "../../geometry";

/**
 * Moves a test map's camera and waits until it is drawn there. A map just created may still be
 * settling its first view, whose `idle` comes first, so this waits for an `idle` at the camera
 * asked for, then two frames for what is on the map to be drawn and hit-testable.
 */
export async function cameraAt(
  map: google.maps.Map,
  camera: { readonly center: LatLng; readonly zoom: number },
): Promise<void> {
  map.setOptions(camera);
  while (!(await idleAt(map, camera.zoom))) {
    // An earlier view's idle: the next one comes once the camera asked for is drawn.
  }
  for (let frame = 0; frame < 2; frame++) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
}

function idleAt(map: google.maps.Map, zoom: number): Promise<boolean> {
  return new Promise((resolve) =>
    google.maps.event.addListenerOnce(map, "idle", () => resolve(map.getZoom() === zoom)),
  );
}
