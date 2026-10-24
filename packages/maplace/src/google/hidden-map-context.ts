/// <reference types="google.maps" preserve="true" />
import { giveBackContextWhileHidden } from "../adapter-kit/hidden-map-context";

/**
 * Found once Google has drawn on it, the canvas can be given back at once: Maps JS keeps the
 * right to a restore at the loss and draws again once the context is back.
 */
const READY_ONCE_FOUND = (run: () => void) => run();

/**
 * Gives a vector map's WebGL context back while its div has no size, and takes it back once it
 * has one (`adapter-kit/hidden-map-context.ts`), until the returned function gives it back for
 * good: Google has no way to destroy a map.
 *
 * The canvas is looked for on `idle`, never before: Google has drawn by then, so its context
 * exists, and asking for one earlier could make it. It's the first canvas in the map's div,
 * Google's own, before the overlays it puts there too (markers, InfoWindows): one canvas, not
 * replaced on hide, show or resize (Maps JS 3.66, Chromium), but followed once it leaves the
 * div. A raster map draws on no WebGL canvas and is left alone.
 */
export function giveBackVectorContextWhileHidden(
  map: google.maps.Map,
  vector: google.maps.RenderingType,
): () => void {
  const element = map.getDiv();
  // A map Google disabled has no div, and its listeners fail (Maps JS 3.66).
  if (element === undefined) return () => {};
  let canvas: HTMLCanvasElement | null = null;
  let releaseContext = () => {};

  const watchesItsCanvas = () => canvas !== null && element.contains(canvas);
  const follow = () => {
    if (watchesItsCanvas() || map.getRenderingType() !== vector) return;
    const drawnOn = element.querySelector("canvas");
    if (drawnOn === null) return;
    releaseContext();
    canvas = drawnOn;
    releaseContext = giveBackContextWhileHidden({ element, canvas, whenReady: READY_ONCE_FOUND });
  };

  const listener = map.addListener("idle", follow);
  return () => {
    releaseContext();
    // Disabled since it opened (a key refused), the map has no div, and its listeners went with it.
    if (map.getDiv() !== undefined) listener.remove();
  };
}
