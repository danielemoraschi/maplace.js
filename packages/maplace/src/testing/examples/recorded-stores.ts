import type { createMaplace, Maplace } from "../../index";

const stores: Maplace[] = [];

/** `createMaplace`, recording each store it makes: an example keeps its store to itself. */
export function recordingCreateMaplace(real: typeof createMaplace): typeof createMaplace {
  return ((...args: Parameters<typeof createMaplace>) => {
    const store = real(...args);
    stores.push(store);
    return store;
  }) as typeof createMaplace;
}

/** The store an example made last. */
export function lastStore(): Maplace {
  const store = stores.at(-1);
  if (store === undefined) throw new Error("the example made no store");
  return store;
}

/** The ids `store` shows, sorted: what its map must draw. */
export function shownIds(store: Maplace): string[] {
  const { locations, filter } = store.getSnapshot();
  return locations
    .filter((location) => location.visible !== false)
    .filter((location) => filter === undefined || filter.includes(location.group ?? ""))
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
