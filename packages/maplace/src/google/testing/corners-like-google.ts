import type { StubMap } from "./stub-libraries";

/** The font Google's `.gm-style` gives everything on a map (Maps JS 3.66). */
const GOOGLES_MAP_FONT = "400 11px Roboto, Arial, sans-serif";

/**
 * Puts what `map`'s corners hold into its element, under Google's inherited font, as Google places
 * controls: the stubs hold them but draw nothing.
 */
export function cornersLikeGoogle(map: StubMap): void {
  const layer = map.getDiv().ownerDocument.createElement("div");
  layer.style.cssText = `position: absolute; inset: 0; font: ${GOOGLES_MAP_FONT}`;
  for (const corner of map.controls) layer.append(...corner.getArray());
  map.getDiv().append(layer);
}
