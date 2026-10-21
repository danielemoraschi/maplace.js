import type { PresentationState } from "../adapter";
import { lookIn, visibilityChanges } from "../adapter-kit/presentation-changes";
import { changedIds } from "../location-state";
import type { GoogleMapState } from "./map-state";

/**
 * The adapter's `present`: keeps the presentation for locations still to be placed, and gives
 * each placed location whose look changed its new one.
 */
export function createPresenting(state: GoogleMapState): (next: PresentationState) => void {
  return (next) => {
    const previous = state.presented;
    state.presented = next;
    const changed = new Set([...changedIds(previous, next), ...visibilityChanges(previous, next)]);
    for (const id of changed) state.placed.get(id)?.present(lookIn(next, id));
    state.mounted?.markers.flush();
  };
}
