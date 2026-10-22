// MapLibre's stylesheet, which the element's npm entry leaves to the page (its version modules
// import their own).
import "maplibre-gl/dist/maplibre-gl.css";
import { setWorkerUrl } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";

/**
 * Points maplibre-gl at its worker as the site's build serves it: bundled, maplibre-gl would look
 * for it beside its own module, where the build put none.
 */
export function useBuiltWorker(): void {
  setWorkerUrl(workerUrl);
}
