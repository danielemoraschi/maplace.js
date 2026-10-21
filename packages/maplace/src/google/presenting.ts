import type { PresentationState } from "../adapter";
import { lookChanges, lookIn } from "../adapter-kit/presentation-changes";
import type { GoogleMapState } from "./map-state";

/**
 * The adapter's `present`: keeps the presentation for locations still to be placed, and gives
 * each placed location whose look changed its new one.
 */
export function createPresenting(state: GoogleMapState): (next: PresentationState) => void {
  return (next) => {
    const previous = state.presented;
    state.presented = next;
    for (const id of lookChanges(previous, next)) state.placed.get(id)?.present(lookIn(next, id));
    state.mounted?.markers.flush();
  };
}
