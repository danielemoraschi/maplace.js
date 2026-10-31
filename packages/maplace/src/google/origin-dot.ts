/// <reference types="google.maps" preserve="true" />
import { createOriginDot, type OriginDot, originDotElement } from "../adapter-kit/origin-dot";
import { ORIGIN_DOT_RANK } from "../adapter-kit/stacking";
import type { GoogleMapState } from "./map-state";
import type { MountedMap } from "./mounted-map";

/** An advanced marker straight on the map, never in the marker layer: no input, under every marker. */
export function createGoogleOriginDot(state: GoogleMapState): OriginDot<MountedMap> {
  return createOriginDot<MountedMap>({
    mounted: () => state.mounted,
    origin: () => state.presented.origin,
    place({ map, libraries }, at) {
      const content = originDotElement(map.getDiv().ownerDocument);
      // Google hangs a marker's content above its point; the dot is centred on it, as on MapLibre.
      content.style.translate = "0 50%";
      const marker = new libraries.marker.AdvancedMarkerElement({
        map,
        position: at,
        content,
        gmpClickable: false,
        zIndex: ORIGIN_DOT_RANK,
      });
      state.originMarker = marker;
      return {
        moveTo(to) {
          marker.position = to;
        },
        remove() {
          marker.map = null;
          state.originMarker = undefined;
        },
      };
    },
  });
}
