import type { LocationDiff, PresentationState } from "../../adapter";
import type { Drawable } from "../../drawable";
import { inChunks } from "./chunks";
import { type MapEntry, type MapState, stateIn } from "./map-state";

/** Locations drawn between yields to the event loop. */
const CHUNK_SIZE = 500;

/** The fake's `apply` and `present`, writing to the map state. */
export interface Drawing {
  apply(diff: LocationDiff): Promise<void>;
  present(next: PresentationState): void;
}

/** Draws into `map` until `stopped` says the map is gone. */
export function createDrawing(map: MapState, stopped: () => boolean): Drawing {
  // Diffs draw in the order given, each after the last, however long one takes.
  let queue = Promise.resolve();

  async function draw({ added, updated, removed }: LocationDiff): Promise<void> {
    for (const id of removed) map.entries.delete(id);
    await inChunks([...added, ...updated], { size: CHUNK_SIZE, each: place, stopped });
  }

  function place(drawable: Drawable): void {
    const entry = map.entries.get(drawable.id);
    if (entry === undefined) map.entries.set(drawable.id, newEntry(drawable));
    else replace(entry, drawable);
  }

  function newEntry(drawable: Drawable): MapEntry {
    const icon = drawable.renderIcon?.(stateIn(map.presented, drawable.id));
    return { drawable, geometry: drawable.geometry, icon };
  }

  /** A new drawable for a drawn location: only what changed is redone, as on a real map. */
  function replace(entry: MapEntry, drawable: Drawable): void {
    if (drawable.geometry !== entry.drawable.geometry) entry.geometry = drawable.geometry;
    const iconChanged = drawable.renderIcon !== entry.drawable.renderIcon;
    entry.drawable = drawable;
    if (iconChanged) entry.icon = drawable.renderIcon?.(stateIn(map.presented, drawable.id));
  }

  return {
    apply(diff) {
      queue = queue.then(() => draw(diff));
      return queue;
    },
    present(next) {
      const previous = map.presented;
      map.presented = next;
      for (const id of changedIds(previous, next)) {
        const entry = map.entries.get(id);
        if (entry) entry.icon = entry.drawable.renderIcon?.(stateIn(next, id));
      }
    },
  };
}

/** The ids whose selection or hover differs between two presentations: their markers rebuild. */
function changedIds(previous: PresentationState, next: PresentationState): string[] {
  const ids = [previous.selectedId, previous.hoveredId, next.selectedId, next.hoveredId];
  return [...new Set(ids)].filter((id): id is string => {
    if (id === undefined) return false;
    const before = stateIn(previous, id);
    const after = stateIn(next, id);
    return before.selected !== after.selected || before.hovered !== after.hovered;
  });
}
