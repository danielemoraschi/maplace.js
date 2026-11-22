// MapLibre's worker for the site's build. Its stylesheet comes with the components that draw maps
// (`MapFrame.astro`, `HeldMaps.astro`; `maplibre-stylesheet-plugin.ts`).
import { setWorkerUrl } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";

/**
 * Points maplibre-gl at its worker as the site's build serves it: bundled, maplibre-gl would look
 * for it beside its own module, where the build put none.
 */
export function useBuiltWorker(): void {
  setWorkerUrl(workerUrl);
}
