import type { LatLng } from "../geometry";

/**
 * How long a click on the map waits for the `dblclick` that would make it half a double-click, and
 * how soon after the last click or `dblclick` a click is a later click of the same gesture.
 */
export const DOUBLE_CLICK_WAIT_MS = 250;

/** A map's clicks, told from double-clicks: what a provider's click events are fed into. */
export interface ClickGesture {
  /**
   * A click at `at`; `count` is how many clicks its DOM event counts (0 or 1 for a first). One
   * the map can't place still counts toward the gesture, and reports nothing.
   */
  click(at: LatLng | undefined, count: number): void;
  /** The map's `dblclick`: the clicks held are half of it. */
  doubleClick(): void;
  /** Drops the clicks held, as a click on a location or the map closing does. */
  dropHeld(): void;
}

/**
 * Reports each single click to `onSingle`. Maps give a double-click as two clicks and a
 * `dblclick`: a click is held for `DOUBLE_CLICK_WAIT_MS` and dropped if a `dblclick` comes first,
 * and the later clicks of one gesture are none: a click within that time of the last click or
 * `dblclick` (a provider's event doesn't always count clicks), or one its DOM event counts above
 * 1. So a double- or triple-click quicker than the hold reports nothing.
 */
export function createClickGesture(onSingle: (at: LatLng) => void): ClickGesture {
  const held = new Set<ReturnType<typeof setTimeout>>();
  let lastClickAt = Number.NEGATIVE_INFINITY;

  function hold(at: LatLng): void {
    const timer = setTimeout(() => {
      held.delete(timer);
      onSingle(at);
    }, DOUBLE_CLICK_WAIT_MS);
    held.add(timer);
  }

  function dropHeld(): void {
    for (const timer of held) clearTimeout(timer);
    held.clear();
  }

  return {
    click(at, count) {
      const now = performance.now();
      const later = now - lastClickAt < DOUBLE_CLICK_WAIT_MS || count > 1;
      lastClickAt = now;
      if (at !== undefined && !later) hold(at);
    },
    doubleClick() {
      lastClickAt = performance.now();
      dropHeld();
    },
    dropHeld,
  };
}
