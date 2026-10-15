import type { Drawing } from "../drawing";

/**
 * Drawing as the parts that wait for it read it: `counts` are the diffs the store has applied
 * and how many are drawn, for a test to set; `progress` is what the part is given.
 */
export function stubDrawingProgress() {
  const counts = { applied: 0, drawn: 0 };
  const progress: Pick<Drawing, "applied" | "drawnThrough"> = {
    applied: () => counts.applied,
    drawnThrough: (count) => counts.drawn >= count,
  };
  return { counts, progress };
}
