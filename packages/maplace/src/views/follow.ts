import type { Maplace, Snapshot } from "../store";
import { type ListRules, listStructureOf } from "./model";
import type { ListVariant } from "./variant";

/** Who follows the store, and by which rules. */
export interface Following<Data> {
  readonly variant: ListVariant<Data>;
  readonly rules: ListRules;
}

/**
 * Renders now, then on every change: the structure only when locations or filter changed, the
 * state only when selection or hover did. Each pass reads the snapshot as it is then, because
 * commits made during delivery are queued.
 */
export function follow<Data>(
  maplace: Maplace<Data>,
  { variant, rules }: Following<Data>,
): () => void {
  let shown: Snapshot<Data> | undefined;
  function sync(): void {
    const snapshot = maplace.getSnapshot();
    if (structureChanged(shown, snapshot))
      variant.renderStructure(listStructureOf(snapshot, rules));
    if (stateChanged(shown, snapshot)) {
      variant.renderState({ selectedId: snapshot.selectedId, hoveredId: snapshot.hoveredId });
    }
    shown = snapshot;
  }
  let unsubscribe: () => void;
  try {
    unsubscribe = maplace.subscribe(sync);
  } catch (error) {
    // A destroyed store: take the view down before the caller hears of it.
    variant.destroy();
    throw error;
  }
  sync();
  return unsubscribe;
}

/** Whether the list shows other entries: its locations or filter changed. */
export function structureChanged(shown: Snapshot | undefined, snapshot: Snapshot): boolean {
  if (shown === undefined) return true;
  return snapshot.locations !== shown.locations || snapshot.filter !== shown.filter;
}

function stateChanged(shown: Snapshot | undefined, snapshot: Snapshot): boolean {
  if (shown === undefined) return true;
  return snapshot.selectedId !== shown.selectedId || snapshot.hoveredId !== shown.hoveredId;
}
