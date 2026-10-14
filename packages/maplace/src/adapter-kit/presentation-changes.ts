import type { PresentationState } from "../adapter";
import type { LocationState } from "../location";

/** A presentation with nothing selected, hovered or hidden: where every map starts. */
export const NOTHING_PRESENTED: PresentationState = {
  selectedId: undefined,
  hoveredId: undefined,
  hiddenIds: new Set(),
};

/** The state `presented` gives one location. */
export function stateIn(presented: PresentationState, id: string): LocationState {
  return { selected: id === presented.selectedId, hovered: id === presented.hoveredId };
}

/** The ids whose selection or hover differs between two presentations: their icons rebuild. */
export function changedIds(previous: PresentationState, next: PresentationState): string[] {
  const ids = [previous.selectedId, previous.hoveredId, next.selectedId, next.hoveredId];
  return [...new Set(ids)].filter((id): id is string => {
    if (id === undefined) return false;
    const before = stateIn(previous, id);
    const after = stateIn(next, id);
    return before.selected !== after.selected || before.hovered !== after.hovered;
  });
}

/** The ids hidden or shown again; none when the hidden ids kept their reference. */
export function visibilityChanges(previous: PresentationState, next: PresentationState): string[] {
  const [before, after] = [previous.hiddenIds, next.hiddenIds];
  if (before === after) return [];
  return [...onlyIn(before, after), ...onlyIn(after, before)];
}

function onlyIn(ids: ReadonlySet<string>, other: ReadonlySet<string>): string[] {
  return [...ids].filter((id) => !other.has(id));
}
