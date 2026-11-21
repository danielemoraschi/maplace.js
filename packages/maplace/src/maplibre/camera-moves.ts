import type { Map as MapLibreMap } from "maplibre-gl";
import type { CameraMove } from "../adapter-kit/camera-move";
import { arcSpan } from "../longitude-arc";
import { attributionInset } from "./attribution";
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
        { padding: fitPadding(map, move.padding), animate: false },
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

/**
 * `padding` on every side of a fitted box, and below it the room MapLibre's attribution takes
 * while open: a location fitted there would sit under it.
 */
function fitPadding(map: MapLibreMap, padding: number) {
  return { top: padding, right: padding, left: padding, bottom: padding + attributionInset(map) };
}
