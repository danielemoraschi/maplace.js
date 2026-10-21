import type { PresentationState } from "../adapter";
import { lookIn, visibilityChanges } from "../adapter-kit/presentation-changes";
import { changedIds } from "../location-state";
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
    const changed = new Set([...changedIds(previous, next), ...visibilityChanges(previous, next)]);
    for (const id of changed) state.placed.get(id)?.present(lookIn(next, id));
    if (state.features) void flushAll(state.features);
  };
}
