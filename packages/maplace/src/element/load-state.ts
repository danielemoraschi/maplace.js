import type { LoadState } from "../index";

/**
 * Shows `state` as the element's custom state, so pages style `maplace-map:state(idle)` (a
 * consent placeholder, say), and as busy while loading: nothing written to its attributes.
 */
export function showLoadState(internals: ElementInternals, state: LoadState): void {
  internals.states.clear();
  internals.states.add(state);
  internals.ariaBusy = state === "loading" ? "true" : null;
}
