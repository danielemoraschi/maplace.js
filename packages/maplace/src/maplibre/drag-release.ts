import type { Marker } from "maplibre-gl";
import type { MountedMapLibre } from "./mounted-map";
import { isInCanvasContainer } from "./pointer-targets";

/**
 * Ends `marker`'s drag when the mouse is let go outside the map's canvas: MapLibre ends a drag on
 * the map's own `mouseup`, which such a release never fires, so the marker would follow the pointer
 * back over the map until the next click. That release is fired as the map's `mouseup`, MapLibre's
 * own end of the drag (a page's `mouseup` listener on its map hears it too, as it would have had
 * the release been over the map). One listener per press on a draggable marker, gone with the map.
 */
export function endDragReleasedOutside(marker: Marker, mounted: MountedMapLibre): void {
  marker.getElement().addEventListener("mousedown", () => {
    if (marker.isDraggable()) awaitRelease(marker, mounted);
  });
}

/**
 * The press's release, heard on the window before anything on the page can stop it. One over the
 * canvas is left to MapLibre, and one after the marker was taken off ends nothing.
 */
function awaitRelease(marker: Marker, { map, maplibre, closing }: MountedMapLibre): void {
  const view = map.getContainer().ownerDocument.defaultView;
  view?.addEventListener(
    "mouseup",
    (event) => {
      if (isInCanvasContainer(event, map) || !marker.getElement().isConnected) return;
      map.fire(new maplibre.MapMouseEvent("mouseup", map, event));
    },
    { once: true, capture: true, signal: closing },
  );
}
