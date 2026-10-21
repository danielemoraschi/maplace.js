import type { Map as MapLibreMap } from "maplibre-gl";
import type { StandingView } from "../adapter-kit/view-follower";
import type { ResolvedView } from "../viewport";

/**
 * Tells the user's moves from everything else: MapLibre gives a move the user started (a drag,
 * the wheel, a key) the input event that started it, and a move made by code none. A user's move
 * ends the standing view; one the store shows after it stands again.
 */
export function createStandingView(map: MapLibreMap): StandingView {
  let view: ResolvedView | undefined;
  const moveStarted = (event: { readonly originalEvent?: unknown }) => {
    if (event.originalEvent !== undefined) view = undefined;
  };
  map.on("movestart", moveStarted);
  return {
    shown(next) {
      view = next;
    },
    standing: () => view,
    stop: () => map.off("movestart", moveStarted),
  };
}
