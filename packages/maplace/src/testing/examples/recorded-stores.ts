import type { createMaplace, Maplace } from "../../index";
import { isShown } from "../../location-state";

const stores: Maplace[] = [];

/** `createMaplace`, recording each store it makes: an example keeps its store to itself. */
export function recordingCreateMaplace(real: typeof createMaplace): typeof createMaplace {
  return ((...args: Parameters<typeof createMaplace>) => {
    const store = real(...args);
    stores.push(store);
    return store;
  }) as typeof createMaplace;
}

/** How many stores were made so far: what `storeAttachedSince` counts from. */
export function recordedStoreCount(): number {
  return stores.length;
}

/**
 * The one store made after the first `count` that was attached: an example's, once it ran.
 * Under StrictMode, React makes one it never attaches first.
 */
export function storeAttachedSince(count: number): Maplace {
  const attached = stores.slice(count).filter(isAttached);
  if (attached.length !== 1) throw new Error(`${attached.length} stores attached, expected 1`);
  return attached[0] as Maplace;
}

function isAttached(store: Maplace): boolean {
  return store.getSnapshot().loadState !== "idle";
}

/** The ids `store` shows, sorted: what its map must draw. */
export function shownIds(store: Maplace): string[] {
  const { locations, filter } = store.getSnapshot();
  return locations
    .filter((location) => isShown(location, filter))
    .map(({ id }) => id)
    .sort(byId);
}

/** `ids` in the order `shownIds` gives, to compare what a map draws with it. */
export function sortedIds(ids: Iterable<string>): string[] {
  return [...ids].sort(byId);
}

function byId(a: string, b: string): number {
  return a.localeCompare(b);
}
