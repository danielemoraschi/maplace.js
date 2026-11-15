/// <reference types="google.maps" preserve="true" />

/**
 * Puts the pane Google draws popups in (`floatPane`) on a compositing layer of its own
 * (`will-change: transform`), as Google puts the advanced markers' pane under it. Without one,
 * Safari paints the markers' layer over an open popup (M39); elsewhere the layer changes nothing
 * maplace draws (the page's popup content positioned `fixed` is placed against the pane).
 * Reached through an overlay, Google's API for its panes, as its markup isn't one; `found` is given
 * the pane. Returns how to take the overlay off, which gives the pane back the `will-change` it had.
 */
export function layerPopupPane(
  map: google.maps.Map,
  maps: google.maps.MapsLibrary,
  found: (pane: HTMLElement) => void,
): () => void {
  const overlay = new maps.OverlayView();
  let giveBack = () => {};
  overlay.onAdd = () => {
    // Typed `Element`, Google's panes are `div`s.
    const pane = overlay.getPanes()?.floatPane as HTMLElement | undefined;
    if (pane === undefined) return;
    const before = pane.style.willChange;
    pane.style.willChange = "transform";
    found(pane);
    giveBack = () => {
      pane.style.willChange = before;
    };
  };
  overlay.draw = () => {};
  overlay.onRemove = () => giveBack();
  overlay.setMap(map);
  return () => overlay.setMap(null);
}
