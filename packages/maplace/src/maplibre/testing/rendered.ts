import type { Map as MapLibreMap } from "maplibre-gl";

/** How long a check waits for MapLibre to render: more under a busy run. */
export const RENDER_WAIT = { timeout: 10_000 };

/** The ids MapLibre renders in `layers`, sorted. */
export function renderedIds(map: MapLibreMap, layers: readonly string[]): string[] {
  const ids = map
    .queryRenderedFeatures({ layers: [...layers] })
    .map(({ properties }) => properties.id);
  return [...new Set<string>(ids)].sort((a, b) => a.localeCompare(b));
}
