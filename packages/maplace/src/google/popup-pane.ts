/// <reference types="google.maps" preserve="true" />
import type { MapPart } from "./mounted-map";

/**
 * Google's popup pane on a compositing layer of its own, from the map's opening to its closing:
 * a page's own map gets the pane back as it was.
 */
export const popupPane: MapPart = {
  open(mounted) {
    mounted.onDestroy(layerPopupPane(mounted.map, mounted.libraries.maps));
  },
};

/**
 * Puts the pane Google draws popups in (`floatPane`) on a compositing layer of its own
 * (`will-change: transform`), as Google puts the advanced markers' pane under it. Without one,
 * Safari paints the markers' layer over an open popup (M39); elsewhere the layer changes nothing
 * maplace draws (the page's popup content positioned `fixed` is placed against the pane).
 * Reached through an overlay, Google's API for its panes, as its markup isn't one. Returns how to
 * take the overlay off, which gives the pane back the `will-change` it had.
 */
export function layerPopupPane(map: google.maps.Map, maps: google.maps.MapsLibrary): () => void {
  const overlay = new maps.OverlayView();
  let giveBack = () => {};
  overlay.onAdd = () => {
    // Typed `Element`, Google's panes are `div`s.
    const pane = overlay.getPanes()?.floatPane as HTMLElement | undefined;
    if (pane === undefined) return;
    const before = pane.style.willChange;
    pane.style.willChange = "transform";
    giveBack = () => {
      pane.style.willChange = before;
    };
  };
  overlay.draw = () => {};
  overlay.onRemove = () => giveBack();
  overlay.setMap(map);
  return () => overlay.setMap(null);
}
