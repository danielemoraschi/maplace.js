import type { Plugin } from "vite";

/**
 * MapLibre's stylesheet as the examples and the map components (`MapFrame.astro`,
 * `HeldMaps.astro`) import it.
 */
export const MAPLIBRE_STYLESHEET = "maplibre-gl/dist/maplibre-gl.css";

/** The empty module the client build gives that import: an id with no `.css`, so no stylesheet. */
const EMPTIED = "\0maplibre-stylesheet-emptied";

/**
 * Empties MapLibre's stylesheet import in the site's client build (W70). Every page's script can
 * reach the examples' MapLibre versions, each importing the sheet, and the build would link it
 * from every page's head, blocking the first paint of pages that draw no map. The components that
 * draw maps (`MapFrame.astro`, `HeldMaps.astro`) import it on the server instead, which links it
 * on their pages alone, ahead of any map. The example files stay as readers copy them.
 */
export function mapLibreStylesheetEmptied(): Plugin {
  return {
    name: "maplace-maplibre-stylesheet-emptied",
    // Before Vite's own resolver, which would find the file.
    enforce: "pre",
    applyToEnvironment: (environment) => environment.name === "client",
    resolveId: (source) => (source === MAPLIBRE_STYLESHEET ? EMPTIED : undefined),
    load: (id) => (id === EMPTIED ? "" : undefined),
  };
}
