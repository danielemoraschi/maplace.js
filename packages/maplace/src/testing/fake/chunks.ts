/** How a long list is worked through. */
export interface Chunking<Item> {
  readonly size: number;
  readonly each: (item: Item) => void;
  /** Checked between chunks: true stops the work (the map was destroyed). */
  readonly stopped: () => boolean;
}

/**
 * Runs `each` over `items` in chunks of `size`, yielding to the event loop between them, so a
 * large diff never blocks input for long (RFC Numbers). A list of one chunk or less finishes
 * without a yield, in a microtask, as a small diff does on a real map.
 */
export async function inChunks<Item>(
  items: readonly Item[],
  { size, each, stopped }: Chunking<Item>,
): Promise<void> {
  for (let index = 0; index < items.length; index++) {
    if (index > 0 && index % size === 0) await nextTask();
    if (index % size === 0 && stopped()) return;
    each(items[index] as Item);
  }
}

/** Resolves on the event loop's next task, after timers already queued. */
export function nextTask(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
