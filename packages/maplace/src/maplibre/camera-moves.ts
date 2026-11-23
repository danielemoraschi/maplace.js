import type { Map as MapLibreMap } from "maplibre-gl";
import type { CameraMove } from "../adapter-kit/camera-move";
import { type Insets, paddedBy } from "../adapter-kit/panel-insets";
import { arcSpan } from "../longitude-arc";
import { lngLatOf, toMapLibreZoom } from "./conversions";

/**
 * Moves the map as `move` says, on MapLibre's zoom: a fit at once, kept clear of `insets`, a jump,
 * or a pan.
 */
export function moveTo(map: MapLibreMap, move: CameraMove, insets: Insets): void {
  switch (move.kind) {
    case "fit": {
      const { south, west, north } = move.bounds;
      // Across ±180° (west > east), east of 180: as far east of west as the box spans.
      const east = west + arcSpan(move.bounds);
      map.fitBounds(
        [
          [west, south],
          [east, north],
        ],
        { padding: paddedBy(insets, move.padding), animate: false },
      );
      return;
    }
    case "jump":
      map.jumpTo({ center: lngLatOf(move.center), zoom: toMapLibreZoom(move.zoom) });
      return;
    case "pan":
      map.panTo(lngLatOf(move.center));
  }
}
