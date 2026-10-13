/**
 * Roving focus: exactly one option is in the tab order (`tabindex="0"`), so Tab reaches the list
 * once and the arrow keys move within it, without generated ids.
 */
export interface Roving {
  /** Makes `element` the tab stop; undefined when the list is empty. */
  stopAt(element: HTMLElement | undefined): void;
  /**
   * Focuses `element` for the view's own reasons (after a re-render), not the user's, without
   * scrolling the page.
   */
  refocus(element: HTMLElement): void;
  /** True while `refocus` runs, so focus handlers can tell the view's moves from the user's. */
  isRefocusing(): boolean;
}

export function createRoving(): Roving {
  let stop: HTMLElement | undefined;
  let refocusing = false;
  return {
    stopAt(element) {
      if (element === stop) return;
      stop?.setAttribute("tabindex", "-1");
      element?.setAttribute("tabindex", "0");
      stop = element;
    },
    refocus(element) {
      refocusing = true;
      try {
        element.focus({ preventScroll: true });
      } finally {
        refocusing = false;
      }
    },
    isRefocusing: () => refocusing,
  };
}
