/// <reference types="google.maps" />
import type { LatLng } from "../../geometry";
import { frames } from "../frames";
import { idle } from "./map-waits";

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
  await frames(2);
}

async function idleAt(map: google.maps.Map, zoom: number): Promise<boolean> {
  await idle(map);
  return map.getZoom() === zoom;
}
