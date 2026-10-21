import { MaplaceError } from "../errors";

/** maplibre-gl itself, as the page installed it. */
export type MapLibre = typeof import("maplibre-gl");

/**
 * maplibre-gl, loaded on mount: a page that never mounts a MapLibre map never loads it, and one
 * missing it gets a load error, not a crash.
 */
export async function loadMapLibre(): Promise<MapLibre> {
  try {
    return await import("maplibre-gl");
  } catch (cause) {
    const message =
      "mount: maplibre-gl failed to load: install it beside maplace (npm install maplibre-gl)";
    throw new MaplaceError("provider-load-failed", message, { cause });
  }
}
