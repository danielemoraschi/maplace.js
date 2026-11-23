/// <reference types="google.maps" preserve="true" />
import type { CameraMove } from "../adapter-kit/camera-move";
import { type Insets, paddedBy } from "../adapter-kit/panel-insets";

/** Google's call for each kind of move, a fit kept clear of `insets`. */
export function moveTo(map: google.maps.Map, move: CameraMove, insets: Insets): void {
  switch (move.kind) {
    case "fit":
      map.fitBounds(move.bounds, paddedBy(insets, move.padding));
      return;
    case "jump":
      map.moveCamera({ center: move.center, zoom: move.zoom });
      return;
    case "pan":
      // Google glides when the pan is shorter than the map, as 0.2's selection did.
      map.panTo(move.center);
  }
}
