import type { Map as MapLibreMap } from "maplibre-gl";
import type { MountedMapLibre } from "./mounted-map";

/**
 * Whether `map` is drawn as a globe: `globe`, `vertical-perspective`, or an expression between
 * projections, as `globe` itself is. A style that sets none (MapLibre gives no projection then),
 * mercator, or a planar projection is flat.
 */
export function isOnGlobe(map: MapLibreMap): boolean {
  const type = map.getProjection()?.type;
  return type === "globe" || type === "vertical-perspective" || Array.isArray(type);
}

/**
 * Calls `switched` each time the map turns from flat to a globe or back, until it closes; not for
 * a style loaded again in the same projection (a hidden map's restored context), which MapLibre
 * also announces.
 */
export function onProjectionSwitch(
  { map, onDestroy }: Pick<MountedMapLibre, "map" | "onDestroy">,
  switched: () => void,
): void {
  let onGlobe = isOnGlobe(map);
  const changed = () => {
    if (isOnGlobe(map) === onGlobe) return;
    onGlobe = !onGlobe;
    switched();
  };
  map.on("projectiontransition", changed);
  onDestroy(() => map.off("projectiontransition", changed));
}
