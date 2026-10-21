import type { AdapterHost } from "../adapter";

/** What can point at a location. */
export type Pointing = "pointer" | "focus";

export interface HoverReports {
  enter(by: Pointing, id: string): void;
  /** Only when `by` is still on `id`: focus leaving A must not clear the pointer on B. */
  leave(by: Pointing, id: string): void;
  /** A location hidden or removed: nothing still points at it, though no event said so. */
  gone(id: string): void;
}

/**
 * The hover a map reports: the location under the pointer, else the one with keyboard focus,
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

/**
 * Reports the pointer over `element` (a marker's) and keyboard focus on it as hovering `id`. A
 * click focuses it as well; only keyboard focus points at it. The listeners go with the element.
 */
export function reportElementHover(element: HTMLElement, id: string, hover: HoverReports): void {
  element.addEventListener("pointerenter", () => hover.enter("pointer", id));
  element.addEventListener("pointerleave", () => hover.leave("pointer", id));
  element.addEventListener("focusin", () => {
    if (element.matches(":focus-visible")) hover.enter("focus", id);
  });
  element.addEventListener("focusout", () => hover.leave("focus", id));
}
