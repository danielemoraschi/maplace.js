import type { AdapterHost } from "../adapter";

/** What can point at a marker. */
export type Pointing = "pointer" | "focus";

export interface HoverReports {
  enter(by: Pointing, id: string): void;
  /** Only when `by` is still on `id`: focus leaving A must not clear the pointer on B. */
  leave(by: Pointing, id: string): void;
  /** A marker hidden or removed: nothing still points at it, though no event said so. */
  gone(id: string): void;
}

/**
 * The hover a map reports: the marker under the pointer, else the one with keyboard focus,
 * reported when it changes.
 */
export function createHoverReports(live: () => AdapterHost | undefined): HoverReports {
  const on: Record<Pointing, string | undefined> = { pointer: undefined, focus: undefined };
  let reported: string | undefined;

  function report(): void {
    const hovered = on.pointer ?? on.focus;
    if (hovered === reported) return;
    reported = hovered;
    live()?.reportHoverChange(hovered);
  }

  return {
    enter(by, id) {
      on[by] = id;
      report();
    },
    leave(by, id) {
      if (on[by] !== id) return;
      on[by] = undefined;
      report();
    },
    gone(id) {
      for (const by of ["pointer", "focus"] as const) if (on[by] === id) on[by] = undefined;
      report();
    },
  };
}
