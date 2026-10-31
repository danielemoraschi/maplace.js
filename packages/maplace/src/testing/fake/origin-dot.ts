import { ORIGIN_DOT_CLASS, originDotElement } from "../../adapter-kit/origin-dot";
import type { LatLng } from "../../geometry";

/** The fake's dot: one element in its layer while there is an origin, nothing without a layer. */
export function createFakeOriginDot(
  layer: () => HTMLElement | undefined,
): (origin: LatLng | undefined) => void {
  return (origin) => {
    const shown = layer();
    if (shown === undefined) return;
    const dot = shown.querySelector(`.${ORIGIN_DOT_CLASS}`);
    if (origin === undefined) dot?.remove();
    else if (dot === null) shown.append(originDotElement(shown.ownerDocument));
  };
}
