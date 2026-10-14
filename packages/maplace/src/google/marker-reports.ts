import type { PlacingSite } from "./placed-location";

/**
 * Reports one marker's clicks, and the pointer or keyboard focus on it, while the map is live.
 * The listeners are on the marker's own element and go with it, so none need taking down.
 */
export function reportMarkerInput(
  marker: HTMLElement,
  id: string,
  { mounted, hover }: PlacingSite,
): void {
  marker.addEventListener("gmp-click", () => mounted.live()?.reportSelect(id));
  marker.addEventListener("pointerenter", () => hover.enter("pointer", id));
  marker.addEventListener("pointerleave", () => hover.leave("pointer", id));
  // A click focuses the marker as well; only keyboard focus points at it.
  marker.addEventListener("focusin", () => {
    if (marker.matches(":focus-visible")) hover.enter("focus", id);
  });
  marker.addEventListener("focusout", () => hover.leave("focus", id));
}
