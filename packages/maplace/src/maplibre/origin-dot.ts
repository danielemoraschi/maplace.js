import { createOriginDot, type OriginDot, originDotElement } from "../adapter-kit/origin-dot";
import { lngLatOf } from "./conversions";
import type { MapLibreState } from "./map-state";
import type { MountedMapLibre } from "./mounted-map";

/**
 * A DOM marker of its own, with no feature, so `locationAt` can't find it. It sets no `z-index`:
 * `auto` is over the canvas's pin layer and under DOM markers and front pins, which set theirs.
 */
export function createMapLibreOriginDot(state: MapLibreState): OriginDot<MountedMapLibre> {
  return createOriginDot<MountedMapLibre>({
    mounted: () => state.mounted,
    origin: () => state.presented.origin,
    place({ map, maplibre }, at) {
      const element = originDotElement(map.getContainer().ownerDocument);
      const marker = new maplibre.Marker({ element }).setLngLat(lngLatOf(at)).addTo(map);
      state.originMarker = marker;
      return {
        moveTo(to) {
          marker.setLngLat(lngLatOf(to));
        },
        remove() {
          marker.remove();
          state.originMarker = undefined;
        },
      };
    },
  });
}
