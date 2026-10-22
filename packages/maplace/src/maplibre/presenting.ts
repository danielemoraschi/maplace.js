import type { PresentationState } from "../adapter";
import { lookChanges, lookIn } from "../adapter-kit/presentation-changes";
import { flushAll } from "./feature-set";
import type { MapLibreState } from "./map-state";

/**
 * The adapter's `present`: keeps the presentation for locations still to be placed, gives each
 * placed location whose look changed its new one, and sends MapLibre what changed in one batch.
 */
export function createPresenting(state: MapLibreState): (next: PresentationState) => void {
  return (next) => {
    const previous = state.presented;
    state.presented = next;
    for (const id of lookChanges(previous, next)) state.placed.get(id)?.present(lookIn(next, id));
    state.mounted?.clustering.flush();
    if (state.features) void flushAll(state.features);
  };
}
