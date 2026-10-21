import type { LocationDiff } from "../adapter";

/** An adapter's diffs, drawn one after another however long one takes. */
export interface DiffQueue {
  /** Queues `diff`; never rejects: a failure is reported, and later diffs still draw. */
  apply(diff: LocationDiff): Promise<void>;
  /** How many diffs were applied so far. */
  applied(): number;
  /** Whether the first `count` diffs applied are drawn: until then, what is placed may be stale. */
  drawnThrough(count: number): boolean;
}

/** Draws each diff with `draw` once the one before has drawn, `reportFailure` told of a failure. */
export function createDiffQueue(
  draw: (diff: LocationDiff) => Promise<void>,
  reportFailure: (cause: unknown) => void,
): DiffQueue {
  let queue = Promise.resolve();
  let applied = 0;
  let drawn = 0;
  return {
    apply(diff) {
      applied++;
      queue = queue
        .then(() => draw(diff))
        // A block: the queue resolves to nothing, whatever `reportFailure` returns.
        .catch((cause: unknown) => {
          reportFailure(cause);
        })
        .finally(() => drawn++);
      return queue;
    },
    applied: () => applied,
    drawnThrough: (count) => drawn >= count,
  };
}
