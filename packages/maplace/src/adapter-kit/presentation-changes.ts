import type { PresentationState } from "../adapter";

/** A presentation with nothing selected, hovered or hidden: where every map starts. */
export const NOTHING_PRESENTED: PresentationState = {
  selectedId: undefined,
  hoveredId: undefined,
  hiddenIds: new Set(),
};

/** The ids hidden or shown again; none when the hidden ids kept their reference. */
export function visibilityChanges(previous: PresentationState, next: PresentationState): string[] {
  const [before, after] = [previous.hiddenIds, next.hiddenIds];
  if (before === after) return [];
  return [...onlyIn(before, after), ...onlyIn(after, before)];
}

function onlyIn(ids: ReadonlySet<string>, other: ReadonlySet<string>): string[] {
  return [...ids].filter((id) => !other.has(id));
}
