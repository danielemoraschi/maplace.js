import type { PresentationState } from "../adapter";
import { isShown } from "../state/lookup";
import type { Snapshot } from "../store";

/** The last presentation sent, with the snapshot it was made from. */
export interface Presented {
  readonly snapshot: Snapshot;
  readonly state: PresentationState;
}

/**
 * What `present` sends for `snapshot`. The last state comes back when nothing in it changed, and
 * its `hiddenIds` when the same ids are hidden, so adapters compare fields with `===`. Hidden ids
 * are worked out again only when the locations or the filter changed.
 */
export function presentationOf(snapshot: Snapshot, last: Presented | undefined): PresentationState {
  const hiddenIds = hiddenIdsOf(snapshot, last);
  const { selectedId, hoveredId } = snapshot;
  const previous = last?.state;
  if (
    previous !== undefined &&
    previous.selectedId === selectedId &&
    previous.hoveredId === hoveredId &&
    previous.hiddenIds === hiddenIds
  ) {
    return previous;
  }
  return Object.freeze({ selectedId, hoveredId, hiddenIds });
}

function hiddenIdsOf(snapshot: Snapshot, last: Presented | undefined): ReadonlySet<string> {
  const previous = last?.state.hiddenIds;
  const unchanged =
    snapshot.locations === last?.snapshot.locations && snapshot.filter === last.snapshot.filter;
  if (previous !== undefined && unchanged) return previous;
  const hidden = new Set<string>();
  for (const location of snapshot.locations) {
    if (!isShown(location, snapshot.filter)) hidden.add(location.id);
  }
  return previous !== undefined && sameMembers(previous, hidden) ? previous : hidden;
}

function sameMembers(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  if (a.size !== b.size) return false;
  for (const id of a) if (!b.has(id)) return false;
  return true;
}
