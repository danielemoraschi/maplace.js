import type { Map as MapLibreMap } from "maplibre-gl";
import type { CameraMove } from "../adapter-kit/camera-move";
import { arcSpan } from "../longitude-arc";
import { lngLatOf, toMapLibreZoom } from "./conversions";

/** Moves the map as `move` says, on MapLibre's zoom: a fit at once, a jump, or a pan. */
export function moveTo(map: MapLibreMap, move: CameraMove): void {
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
        { padding: move.padding, animate: false },
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
