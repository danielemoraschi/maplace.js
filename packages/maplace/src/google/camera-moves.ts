/// <reference types="google.maps" preserve="true" />
import type { CameraMove } from "../adapter-kit/camera-move";

/** Google's call for each kind of move. */
export function moveTo(map: google.maps.Map, move: CameraMove): void {
  switch (move.kind) {
    case "fit":
      map.fitBounds(move.bounds, move.padding);
      return;
    case "jump":
      map.moveCamera({ center: move.center, zoom: move.zoom });
      return;
    case "pan":
      // Google glides when the pan is shorter than the map, as 0.2's selection did.
      map.panTo(move.center);
  }
}
