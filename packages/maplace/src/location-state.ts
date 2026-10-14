import type { LocationState } from "./location";

/** Which location is selected and which hovered: what a location's state follows. */
export interface SelectionAndHover {
  readonly selectedId: string | undefined;
  readonly hoveredId: string | undefined;
}

export function stateIn(state: SelectionAndHover, id: string): LocationState {
  return { selected: id === state.selectedId, hovered: id === state.hoveredId };
}

export function sameState(a: LocationState, b: LocationState): boolean {
  return a.selected === b.selected && a.hovered === b.hovered;
}

/** The ids whose selection or hover differs between two states, once each: they repaint. */
export function changedIds(previous: SelectionAndHover, next: SelectionAndHover): string[] {
  const ids = [previous.selectedId, previous.hoveredId, next.selectedId, next.hoveredId];
  return [...new Set(ids)].filter(
    (id): id is string => id !== undefined && !sameState(stateIn(previous, id), stateIn(next, id)),
  );
}
